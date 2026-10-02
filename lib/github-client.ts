import type { RepoRef } from "@/lib/github";

/**
 * GitHub Contents API 的薄封装，在**浏览器里**运行。
 *
 * token 由调用方传入（来自一个需要鉴权的 server action），这个模块自己
 * 不持有、不缓存、不落 localStorage —— admin 页面会渲染用户写的 markdown，
 * 把长期凭证放进一个渲染用户输入的页面的持久存储里，是在赌 remark-html
 * 的转义行为。
 */

const API = "https://api.github.com";

function headers(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * 把 GitHub 的原始错误**原样透传**。
 *
 * 401（token 过期）、403（权限不足）、404（路径错/无权限）、409（并发冲突）、
 * 422（更新时没带 sha）—— 这些原因非常具体，包装成"保存失败"等于把
 * 排查线索扔掉。用户在后台看到的就是 GitHub 的原话。
 */
async function ensureOk(res: Response, action: string): Promise<void> {
  if (res.ok) return;

  let detail = "";
  try {
    const body = (await res.json()) as { message?: string; errors?: unknown };
    detail = body.message ?? "";
    if (body.errors) detail += ` ${JSON.stringify(body.errors)}`;
  } catch {
    detail = await res.text().catch(() => "");
  }

  const hint =
    res.status === 401
      ? "（token 可能已过期或被撤销）"
      : res.status === 409 || res.status === 422
        ? "（文件在别处被改过，请刷新后重试）"
        : "";

  throw new Error(
    `GitHub ${action} 失败：HTTP ${res.status} ${detail}${hint}`.trim(),
  );
}

/* ------------------------------------------------ base64 —— 必须走字节 */

/**
 * 不能直接用 btoa —— 它把每个字符当成一个字节，中文会抛
 * InvalidCharacterError。GitHub 的 content 字段是 base64 编码的文件内容，
 * 所以要先按 UTF-8 编成字节再 base64。
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64.replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/* ---------------------------------------------------------------- 操作 */

export type RepoFile = { name: string; path: string; sha: string };

/** 列目录。目录不存在时 GitHub 返回 404，这里归一成空数组。 */
export async function listFiles(
  ref: RepoRef,
  dir: string,
): Promise<RepoFile[]> {
  const res = await fetch(
    `${API}/repos/${ref.owner}/${ref.repo}/contents/${dir}?ref=main`,
    { headers: headers(ref.token), cache: "no-store" },
  );

  if (res.status === 404) return [];
  await ensureOk(res, `读取 ${dir}`);

  const body = (await res.json()) as unknown;
  if (!Array.isArray(body)) return [];

  return body
    .filter(
      (e): e is { name: string; path: string; sha: string; type: string } =>
        typeof e === "object" && e !== null && "type" in e,
    )
    .filter((e) => e.type === "file")
    .map((e) => ({ name: e.name, path: e.path, sha: e.sha }));
}

export type FileWithSha = { content: string; sha: string };

/**
 * 读文件。
 *
 * 编辑已有文件前**必须先调它拿 sha** —— Contents API 更新时必须带 sha，
 * 否则返回 422。所以保存流程是 GET → PUT，不是直接 PUT。
 */
export async function readFile(
  ref: RepoRef,
  path: string,
): Promise<FileWithSha | null> {
  const res = await fetch(
    `${API}/repos/${ref.owner}/${ref.repo}/contents/${path}?ref=main`,
    { headers: headers(ref.token), cache: "no-store" },
  );

  if (res.status === 404) return null;
  await ensureOk(res, `读取 ${path}`);

  const body = (await res.json()) as {
    content?: string;
    sha?: string;
    encoding?: string;
  };
  if (typeof body.content !== "string" || typeof body.sha !== "string") {
    throw new Error(`GitHub 读取 ${path} 的响应缺少 content/sha 字段`);
  }
  return { content: fromBase64(body.content), sha: body.sha };
}

/**
 * 写文件。带 sha 是更新，不带是新建（文件已存在却不带 sha → 422）。
 * 返回本次提交的 sha，供界面给出 GitHub 链接。
 */
export async function writeFile(
  ref: RepoRef,
  path: string,
  content: string,
  message: string,
  sha?: string,
): Promise<{ commitSha: string }> {
  const res = await fetch(
    `${API}/repos/${ref.owner}/${ref.repo}/contents/${path}`,
    {
      method: "PUT",
      headers: { ...headers(ref.token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: toBase64(content),
        branch: "main",
        ...(sha ? { sha } : {}),
      }),
    },
  );

  await ensureOk(res, `写入 ${path}`);
  const body = (await res.json()) as { commit?: { sha?: string } };
  return { commitSha: body.commit?.sha ?? "" };
}

export async function deleteFile(
  ref: RepoRef,
  path: string,
  sha: string,
  message: string,
): Promise<{ commitSha: string }> {
  const res = await fetch(
    `${API}/repos/${ref.owner}/${ref.repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: { ...headers(ref.token), "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: "main" }),
    },
  );

  await ensureOk(res, `删除 ${path}`);
  const body = (await res.json()) as { commit?: { sha?: string } };
  return { commitSha: body.commit?.sha ?? "" };
}

/** 提交页面的 URL，提交成功后贴给用户，让他能自己核对。 */
export function commitUrl(ref: RepoRef, sha: string): string {
  return `https://github.com/${ref.owner}/${ref.repo}/commit/${sha}`;
}

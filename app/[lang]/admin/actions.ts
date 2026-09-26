"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  SESSION_COOKIE,
  isLockedOut,
  isValidSessionToken,
  issueSessionToken,
  recordLoginFailure,
  resetLoginAttempts,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { moments, posts } from "@/lib/content";
import { isLang, type Lang } from "@/lib/i18n";
import { slugify, todayStamp, uniqueSlug } from "@/lib/slug";

/**
 * 从 FormData 里取语言，并校验。
 * 不信任客户端传来的任何值——lang 会拼进重定向 URL。
 */
function readLang(formData: FormData): Lang | null {
  const raw = String(formData.get("lang") ?? "");
  return isLang(raw) ? raw : null;
}

/**
 * 鉴权断言。每个写入 action 的第一行都必须调它。
 *
 * **刻意不放在 proxy.ts 里**，三条理由：
 *  1. proxy 的 matcher 显式排除了 /api，放在那里的检查对 API 路由不存在；
 *  2. 同一个 /[lang]/admin 既要给未认证用户渲染登录表单、又要给已认证用户
 *     渲染编辑器，middleware 区分不了"来读表单"和"来提交数据"，无法用它
 *     做放行/拦截；
 *  3. 纵深防御——即使以后在 proxy 里也加了检查，这里仍必须独立再查一次。
 *
 * 也**不能依赖 Next 内置的 Server Action origin 校验**：读
 * node_modules/next/dist/server/app-render/action-handler.js 可见，缺少
 * Origin 头的请求只打一条 warning 就放行（源码注释原文："We'll let this
 * through but log a warning."）。它不是一道防线。
 */
export async function requireAuth(): Promise<void> {
  const store = await cookies();
  if (!isValidSessionToken(store.get(SESSION_COOKIE)?.value)) {
    // 抛错而非 redirect：redirect 会让"未认证的写入"在客户端看起来像成功
    // （页面跳转到了登录页），而抛错让调用方拿到明确的失败。
    throw new Error("unauthorized");
  }
}

/**
 * 登录。全站唯一不需要 requireAuth 的 action，因此它有独立的守卫：
 * 限速 + 密码校验。
 */
export async function loginAction(formData: FormData): Promise<void> {
  const lang = readLang(formData);
  if (!lang) redirect("/");

  if (isLockedOut()) {
    redirect(`/${lang}/admin?error=locked`);
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    recordLoginFailure();
    redirect(`/${lang}/admin?error=bad`);
  }

  resetLoginAttempts();
  const store = await cookies();
  store.set(SESSION_COOKIE, issueSessionToken(), sessionCookieOptions());

  // 登录不改动任何内容，因此**不做 revalidatePath**——多余的 revalidate
  // 只会让 /admin 无谓地重新渲染一遍。
  redirect(`/${lang}/admin`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  const lang = readLang(formData);
  redirect(lang ? `/${lang}/admin` : "/");
}

/* ------------------------------------------------------- 内容写入 */

type Kind = "post" | "moment";

const collectionOf = (kind: Kind) => (kind === "post" ? posts : moments);

/** slug 只允许这三个字符集，防止构造出越出目录的路径。 */
function isSafeSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug) && slug.length <= 120;
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

/** 去掉 markdown 记号，用于自动生成 moments 的摘要。 */
function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-\[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 内容写入后的缓存失效。**两层的顺序不能反，而且清缓存必须在 revalidate 之前。**
 *
 * revalidatePath 只是把路径**标记为过期**，真正的重新渲染发生在下一次请求。
 * 若先 revalidate 再 clearCache，落在两者之间的那次请求会读到旧的 listCache，
 * 把旧列表重新写回 ISR 缓存，并附上一个新的 60 秒计时器——这正是"发布了但
 * 列表页还是旧的"那个 bug，而且会稳定复现。
 *
 * 删除时对详情页的 revalidate 尤其不能省：ISR 不会因为源文件消失而失效，
 * 不写这一行，被删的文章会以 200 继续对外服务（软 404，会被搜索引擎收录）。
 */
function invalidate(
  lang: Lang,
  kind: Kind,
  slug: string,
  { includeDetail }: { includeDetail: boolean },
): void {
  collectionOf(kind).clearCache();

  const base = kind === "post" ? `/${lang}/blog` : `/${lang}/moments`;
  revalidatePath(base);
  if (includeDetail) revalidatePath(`${base}/${slug}`);
}

export async function createPostAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));

  if (!title || !body) redirect(`/${lang}/admin?error=empty`);

  const date = todayStamp();
  // 冲突检查要看两个目录的并集——仓库里已有的 slug 也算被占用，
  // 否则 runtime 文件会被 git 版本遮蔽（读取时 git 优先），表现为"发布了但看不到"。
  const base = slugify(title, date);
  const slug = uniqueSlug(posts.getSlugs(lang), base);

  const collection = posts;
  collection.writeRuntime(lang, slug, { title, date, tags, summary: "", lang }, body);
  invalidate(lang, "post", slug, { includeDetail: true });

  redirect(`/${lang}/admin?ok=${encodeURIComponent(slug)}`);
}

export async function updatePostAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const slug = String(formData.get("slug") ?? "");
  // slug 决定 URL，编辑时**不允许改**——它是不可逆的对外契约。
  // 前端把它作为隐藏字段传回，且服务端只接受合法字符集，不重算。
  if (!isSafeSlug(slug)) redirect(`/${lang}/admin?error=slug`);

  const existing = posts.readRuntime(lang, slug);
  if (!existing) redirect(`/${lang}/admin?error=notfound`);

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  if (!title || !body) redirect(`/${lang}/admin?error=empty`);

  posts.writeRuntime(lang, slug, {
    title,
    date: String(existing.data.date ?? todayStamp()),
    tags,
    summary: String(existing.data.summary ?? ""),
    lang,
  }, body);
  invalidate(lang, "post", slug, { includeDetail: true });

  redirect(`/${lang}/admin?ok=${encodeURIComponent(slug)}`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const slug = String(formData.get("slug") ?? "");
  if (!isSafeSlug(slug)) redirect(`/${lang}/admin?error=slug`);

  posts.deleteRuntime(lang, slug);
  invalidate(lang, "post", slug, { includeDetail: true });

  redirect(`/${lang}/admin`);
}

export async function createMomentAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/${lang}/admin?error=empty`);

  const date = todayStamp();
  // moments 在界面上只有一个文本框，标题与摘要都由服务端生成。
  // 标题取正文首行（供 <title> 与 SEO 用），摘要取纯文本前 80 字。
  const flat = plainText(body);
  const title = flat.slice(0, 40) || `moment-${date}`;
  const summary = flat.slice(0, 80);

  const slug = uniqueSlug(moments.getSlugs(lang), slugify(title, date));
  moments.writeRuntime(lang, slug, { title, date, tags: [], summary, lang }, body);
  // moments 没有详情页，只 revalidate 列表页。
  invalidate(lang, "moment", slug, { includeDetail: false });

  redirect(`/${lang}/admin?ok=${encodeURIComponent(slug)}`);
}

export async function updateMomentAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const slug = String(formData.get("slug") ?? "");
  if (!isSafeSlug(slug)) redirect(`/${lang}/admin?error=slug`);

  const existing = moments.readRuntime(lang, slug);
  if (!existing) redirect(`/${lang}/admin?error=notfound`);

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/${lang}/admin?error=empty`);

  const date = String(existing.data.date ?? todayStamp());
  const flat = plainText(body);
  moments.writeRuntime(lang, slug, {
    title: flat.slice(0, 40) || `moment-${date}`,
    date,
    tags: [],
    summary: flat.slice(0, 80),
    lang,
  }, body);
  invalidate(lang, "moment", slug, { includeDetail: false });

  redirect(`/${lang}/admin?ok=${encodeURIComponent(slug)}`);
}

export async function deleteMomentAction(formData: FormData): Promise<void> {
  await requireAuth();
  const lang = readLang(formData);
  if (!lang) redirect("/");

  const slug = String(formData.get("slug") ?? "");
  if (!isSafeSlug(slug)) redirect(`/${lang}/admin?error=slug`);

  moments.deleteRuntime(lang, slug);
  invalidate(lang, "moment", slug, { includeDetail: false });

  redirect(`/${lang}/admin`);
}

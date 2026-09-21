import fs from "fs";
import path from "path";
import { randomBytes } from "node:crypto";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { Lang } from "@/lib/i18n";

export type ContentMeta = {
  title: string;
  date: string;
  summary?: string;
  tags?: string[];
  lang: Lang;
};

export type ContentItem = ContentMeta & { slug: string };
export type ContentDetail = ContentItem & { contentHtml: string };

/**
 * posts / projects / moments 共用一套读取逻辑。
 *
 * 内容有两个来源，读取时合并：
 *
 *   content/<name>/<lang>/          仓库策展内容，git 跟踪，只读
 *   content/runtime/<name>/<lang>/  网页端发布的内容，gitignored，可改可删
 *
 * 之所以要分区而不是都写进前者：仓库里的文件是 git 跟踪的，从管理界面删掉
 * 它，下一次部署的 `git reset --hard` 会把它复活；编辑它则会被静默回滚。
 * 分区之后规则是干净的——runtime 目录里可改可删，git 里的只读。
 */
function createCollection(dirName: string) {
  const baseDir = path.join(process.cwd(), "content", dirName);
  const runtimeBase = path.join(process.cwd(), "content", "runtime", dirName);

  const gitLangDir = (lang: Lang) => path.join(baseDir, lang);
  const runtimeLangDir = (lang: Lang) => path.join(runtimeBase, lang);

  // 列表缓存带一份目录指纹。
  //
  // 不设 TTL：短了会让每次 ISR 再生都触发全量同步读盘（getItems 是同步函数，
  // 跑在请求路径上，没有 yield 点，会阻塞事件循环），长了又会让"发布后列表
  // 没变"重现。发布是确定性事件，用显式 clearCache() 即可。
  //
  // 指纹只能捕捉**文件增删**（目录 mtime 变化），捕捉不到**原地编辑**
  // （改文件内容不改变目录 mtime）。原地编辑靠 clearCache() 覆盖——所有
  // 写入路径都会调它。指纹的价值是兜住"有人直接 scp 一个文件上来"这类
  // 绕过应用的改动。
  let cache = new Map<Lang, { items: ContentItem[]; stamp: string }>();

  function dirStamp(lang: Lang): string {
    const parts: string[] = [];
    for (const dir of [gitLangDir(lang), runtimeLangDir(lang)]) {
      try {
        parts.push(String(fs.statSync(dir).mtimeMs));
      } catch {
        // 目录不存在是正常状态（比如还没有人发布过内容），不是错误。
        parts.push("-");
      }
    }
    return parts.join("|");
  }

  function listDir(dir: string): string[] {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
  }

  function getSlugs(lang: Lang): string[] {
    return [...new Set([...listDir(gitLangDir(lang)), ...listDir(runtimeLangDir(lang))])];
  }

  /**
   * slug 解析为文件路径。**git 目录优先。**
   *
   * 这条规则在同步（Phase B）的所有时刻都成立：帖子同步进 git 后，磁盘上
   * 会同时存在 git 版与 runtime 版，而两份内容相同，所以谁胜出在视觉上
   * 无差别。等部署成功、清理掉 runtime 副本后，git 自然成为唯一真相。
   */
  function resolvePath(lang: Lang, slug: string): string | null {
    const inGit = path.join(gitLangDir(lang), `${slug}.md`);
    if (fs.existsSync(inGit)) return inGit;
    const inRuntime = path.join(runtimeLangDir(lang), `${slug}.md`);
    if (fs.existsSync(inRuntime)) return inRuntime;
    return null;
  }

  function readItem(lang: Lang, slug: string): ContentItem | null {
    const full = resolvePath(lang, slug);
    if (!full) return null;
    const { data } = matter(fs.readFileSync(full, "utf8"));
    return {
      slug,
      title: data.title || slug,
      date: data.date || "1970-01-01",
      summary: data.summary || "",
      tags: data.tags || [],
      lang,
    };
  }

  function getItems(lang: Lang): ContentItem[] {
    const stamp = dirStamp(lang);
    const hit = cache.get(lang);
    if (hit && hit.stamp === stamp) return hit.items;

    const items = getSlugs(lang)
      .map((slug) => readItem(lang, slug))
      .filter((item): item is ContentItem => item !== null)
      .sort((a, b) => (a.date > b.date ? -1 : 1));

    cache.set(lang, { items, stamp });
    return items;
  }

  async function renderMarkdown(content: string): Promise<string> {
    return (await remark().use(html).process(content)).toString();
  }

  async function getDetail(
    lang: Lang,
    slug: string,
  ): Promise<ContentDetail | null> {
    const full = resolvePath(lang, slug);
    if (!full) return null;

    const { data, content } = matter(fs.readFileSync(full, "utf8"));
    return {
      slug,
      title: data.title || slug,
      date: data.date || "1970-01-01",
      summary: data.summary || "",
      tags: data.tags || [],
      lang,
      contentHtml: await renderMarkdown(content),
    };
  }

  /**
   * 批量取详情。moments 列表要显示正文，逐条调 getDetail 会跑 N 次
   * remark()——每次都是完整的 markdown 解析加一次 await。这里共用一遍循环。
   */
  async function getItemsWithHtml(lang: Lang): Promise<ContentDetail[]> {
    return Promise.all(
      getItems(lang).map(async (item) => {
        const detail = await getDetail(lang, item.slug);
        // getItems 与 getDetail 之间文件被删掉时返回 null，跳过而不是崩掉整页。
        return detail;
      }),
    ).then((list) => list.filter((d): d is ContentDetail => d !== null));
  }

  /* ------------------------------------------------------------ 写入侧 */

  /** 管理界面用：只看 runtime 目录，且不走缓存（刚写完就要看到结果）。 */
  function listRuntime(lang: Lang): ContentItem[] {
    return listDir(runtimeLangDir(lang))
      .map((slug) => readItem(lang, slug))
      .filter((item): item is ContentItem => item !== null)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  /**
   * 判断某个 slug 是否已被仓库策展内容占用。
   * 管理界面据此把这类条目标成"仓库收录"并转为只读。
   */
  function isInGit(lang: Lang, slug: string): boolean {
    return fs.existsSync(path.join(gitLangDir(lang), `${slug}.md`));
  }

  function readRuntime(
    lang: Lang,
    slug: string,
  ): { data: Record<string, unknown>; content: string } | null {
    const full = path.join(runtimeLangDir(lang), `${slug}.md`);
    if (!fs.existsSync(full)) return null;
    const { data, content } = matter(fs.readFileSync(full, "utf8"));
    return { data, content };
  }

  function writeRuntime(
    lang: Lang,
    slug: string,
    frontmatter: Record<string, unknown>,
    body: string,
  ): void {
    const dir = runtimeLangDir(lang);
    fs.mkdirSync(dir, { recursive: true });

    assertValidFrontmatter(frontmatter);
    const serialized = serializeFrontmatter(frontmatter, body);

    // 写入前自校验。畸形 YAML 的后果不是"这一篇读不出来"，而是**下一次部署
    // 时 npm run build 在 generateStaticParams 里抛错、整个部署失败**——而
    // 那时没人会联想到是几天前发的那篇文章。把故障挡在写入时。
    try {
      matter(serialized);
    } catch (err) {
      throw new Error(
        `[content] 生成的 frontmatter 无法解析，拒绝写入。这通常意味着标题或标签里` +
          `有意外字符。原始错误：${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // 原子写：先写同目录的临时文件再 rename。
    //
    // 不能直接 writeFileSync 到目标路径——getItems 是同步读，与写入并发时
    // 可能读到写了一半的文件，matter() 会抛 YAML 解析错误、整个列表页 500。
    // rename 在同一文件系统上是原子的：读端要么看到旧文件，要么看到新文件。
    //
    // 临时名带 pid 与随机后缀，两个并发请求不会互相截断。`.tmp` 后缀与
    // getSlugs 的 endsWith(".md") 过滤天然兼容，临时文件不会被读成文章。
    const tmp = path.join(
      dir,
      `.${slug}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`,
    );
    fs.writeFileSync(tmp, serialized, "utf8");
    fs.renameSync(tmp, path.join(dir, `${slug}.md`));
  }

  function deleteRuntime(lang: Lang, slug: string): boolean {
    const full = path.join(runtimeLangDir(lang), `${slug}.md`);
    if (!fs.existsSync(full)) return false;
    fs.unlinkSync(full);
    return true;
  }

  /** 运行时写入后必须调用，否则列表页在进程重启前看不到变化。 */
  function clearCache(): void {
    cache = new Map();
  }

  return {
    getSlugs,
    getItems,
    getDetail,
    getItemsWithHtml,
    listRuntime,
    readRuntime,
    isInGit,
    writeRuntime,
    deleteRuntime,
    clearCache,
  };
}

/**
 * frontmatter 类型校验，写入前的最后一道闸。
 *
 * 光靠"能否被 YAML 解析"是不够的：JSON.stringify 保证产出的一定是合法
 * YAML，但它不保证**形状**对。比如 tags 传进来一个对象，序列化出的
 * `tags: {"a":1}` 是合法 YAML，能通过解析检查，但读回来 tags 不是数组，
 * 列表页 `.map()` 直接抛错——而且是在下一次部署构建时才炸。
 *
 * 日期格式也在这里卡死：getItems 用字符串比较排序，混入时间会让排序
 * 结果不符合直觉；格式不统一还会让排序静默错乱。
 */
function assertValidFrontmatter(data: Record<string, unknown>): void {
  const problems: string[] = [];

  if (typeof data.title !== "string" || !data.title.trim()) {
    problems.push("title 必须是非空字符串");
  }
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    problems.push("date 必须是 YYYY-MM-DD 格式的字符串");
  }
  if (data.summary !== undefined && typeof data.summary !== "string") {
    problems.push("summary 必须是字符串");
  }
  if (data.tags !== undefined) {
    if (
      !Array.isArray(data.tags) ||
      data.tags.some((t) => typeof t !== "string")
    ) {
      problems.push("tags 必须是字符串数组");
    }
  }
  if (typeof data.lang !== "string") {
    problems.push("lang 必须是字符串");
  }

  if (problems.length > 0) {
    throw new Error(`[content] frontmatter 不合法，拒绝写入：${problems.join("；")}`);
  }
}

/**
 * frontmatter 序列化。**必须走 JSON.stringify，不能手写引号拼接。**
 *
 * JSON 字符串是合法的 YAML 标量（YAML 1.2 是 JSON 的超集），所以
 * JSON.stringify 产出的带转义引号的字符串能被 gray-matter 正确解析。
 * 手写 `"${title}"` 在标题含引号、冒号或换行时会产出畸形 YAML——后果见
 * writeRuntime 里的注释：不是这一篇读不出来，是下一次部署整个失败。
 *
 * 非 ASCII 字符不会被转义（JSON.stringify("你好") === '"你好"'），
 * 所以中文标题在文件里保持可读。
 */
function serializeFrontmatter(
  data: Record<string, unknown>,
  body: string,
): string {
  const lines = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.trim()}\n`;
}

export const posts = createCollection("posts");
export const projects = createCollection("projects");
export const moments = createCollection("moments");

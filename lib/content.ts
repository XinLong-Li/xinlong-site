import fs from "fs";
import path from "path";
import { randomBytes } from "node:crypto";
import matter from "gray-matter";
import { remark } from "remark";
import gfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import rehypeCodeBlocks from "@/lib/rehype-code-blocks";
import rehypeSafeUrls from "@/lib/rehype-safe-urls";
import { getDictionary, type Lang } from "@/lib/i18n";

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
/** 手工遍历 mdast 树，避免为十来行逻辑再引入 unist-util-visit。 */
type MdNode = { type: string; depth?: number; children?: MdNode[] };

function walkMd(node: MdNode, fn: (n: MdNode) => void): void {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walkMd(child, fn);
  }
}

/**
 * 把正文标题下移到 h2 起步。
 *
 * 文章标题本身就是页面的 `<h1>`，正文里再出现 `#` 就有两个 h1：语义上是错的，
 * 而且 `components/Prose.tsx` 只给 h2/h3/h4 写了样式，正文里的 `#` 会退化成
 * 浏览器默认样式 —— 看起来像"样式坏了"。
 *
 * 规则是**看这篇文档最浅的标题有多浅**，只补到 h2 为止：
 *
 *   正文从 `#` 开始（从笔记软件粘过来的常见情况）→ 整体下沉一级
 *   正文从 `##` 开始（仓库里已有的约定）        → 一级都不动
 *
 * 所以这不是"统一改版"：已有内容的渲染结果逐字节不变（6 个项目文件最浅都是
 * `##`，移位量为 0）。只有真的出现 h1 的文档才会被移动。
 */
function normalizeHeadings() {
  return (tree: MdNode): void => {
    let shallowest = Number.POSITIVE_INFINITY;
    walkMd(tree, (n) => {
      if (n.type === "heading" && typeof n.depth === "number") {
        shallowest = Math.min(shallowest, n.depth);
      }
    });

    if (!Number.isFinite(shallowest)) return;
    const shift = Math.max(0, 2 - shallowest);
    if (shift === 0) return;

    walkMd(tree, (n) => {
      // 封顶在 h6：CommonMark 只有六级，再深就只能压平了。
      if (n.type === "heading" && typeof n.depth === "number") {
        n.depth = Math.min(6, n.depth + shift);
      }
    });
  };
}

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

  /**
   * 正文渲染。**`.use(gfm)` 不能去掉。**
   *
   * 表格、删除线、任务列表、自动链接都是 GFM 扩展，不在 CommonMark 里 ——
   * 光有 `remark` 的话，表格会被当成普通段落渲染成一堆竖线（实测：`|方案|风险|`
   * 那几行原样出现在 <p> 里，没有 <table>）。从别处粘过来的笔记默认就带这些东西，
   * 所以不是可选项。
   *
   * 管线是 remark → rehype 两段：mdast 侧做 GFM 与标题归一，转成 hast 后依次做
   * URL 净化、语法高亮、复制按钮。之所以从 `remark-html` 换过来，唯一原因是它没有
   * 插入 rehype 插件的口子 —— 高亮必须在服务端完成（页面是构建期预渲染 + 60s ISR
   * 再生，不能给浏览器发高亮器，也不能有 FOUC）。换管线对已有内容是**逐字节无损**的
   * （实测 12/12 断言全等，唯一差别是 remark-html 会补的那个结尾换行，见下面 `+ "\n"`）。
   *
   * **`rehypeSafeUrls` 不能去掉**：remark-html 默认是净化的，实测它会把
   * `[x](javascript:alert(1))` 的 href 摘掉；rehype 默认不摘。那个插件就是补回这一层，
   * 否则换管线等于顺手撤掉一道防线。
   *
   * 高亮用 highlight.js 的 common 集（37 种语言）。`rehype-highlight` 无论如何都会
   * `import {common}`（读过 v7 源码），传 `subset` 只影响自动识别、省不下任何字节，
   * 所以不折腾子集，能在后台粘什么语言就高亮什么语言。
   *
   * `lang` 只用来取复制按钮的文案（复制/已复制/复制失败），按语言烤进 HTML ——
   * 页面本身就是按语言静态生成的，文案留在服务端即可。
   */
  async function renderMarkdown(content: string, lang: Lang): Promise<string> {
    const { code } = getDictionary(lang);
    const file = await remark()
      .use(gfm)
      .use(normalizeHeadings)
      .use(remarkRehype)
      .use(rehypeSafeUrls)
      .use(rehypeHighlight)
      .use(rehypeCodeBlocks, { labels: code })
      .use(rehypeStringify)
      .process(content);
    // remark-html 会在结尾补一个换行，补上它才能保住"已有内容逐字节不变"。
    return file.toString() + "\n";
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
      contentHtml: await renderMarkdown(content, lang),
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
    clearCache,
  };
}



export const posts = createCollection("posts");
export const projects = createCollection("projects");
export const moments = createCollection("moments");

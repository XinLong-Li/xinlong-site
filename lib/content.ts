import fs from "fs";
import path from "path";
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
 * posts 与 projects 两个集合的读取逻辑此前是两份 ~95% 相同的拷贝
 * （lib/posts.ts 与 lib/projects.ts），这里收敛为一个工厂。
 */
function createCollection(dirName: string) {
  const baseDir = path.join(process.cwd(), "content", dirName);

  // 列表页此前对同一目录重复 readdir + readFile（getSlugs 与 getItems
  // 各跑一遍），这里按语言记忆化一次。
  const listCache = new Map<Lang, ContentItem[]>();

  function langDir(lang: Lang): string {
    return path.join(baseDir, lang);
  }

  function getSlugs(lang: Lang): string[] {
    const dir = langDir(lang);
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
  }

  function getItems(lang: Lang): ContentItem[] {
    const cached = listCache.get(lang);
    if (cached) return cached;

    const dir = langDir(lang);
    const items = getSlugs(lang)
      .map((slug) => {
        const { data } = matter(
          fs.readFileSync(path.join(dir, `${slug}.md`), "utf8"),
        );
        return {
          slug,
          title: data.title || slug,
          date: data.date || "1970-01-01",
          summary: data.summary || "",
          tags: data.tags || [],
          lang,
        } satisfies ContentItem;
      })
      .sort((a, b) => (a.date > b.date ? -1 : 1));

    listCache.set(lang, items);
    return items;
  }

  async function getDetail(
    lang: Lang,
    slug: string,
  ): Promise<ContentDetail | null> {
    const fullPath = path.join(langDir(lang), `${slug}.md`);
    if (!fs.existsSync(fullPath)) return null;

    const { data, content } = matter(fs.readFileSync(fullPath, "utf8"));
    const contentHtml = (
      await remark().use(html).process(content)
    ).toString();

    return {
      slug,
      title: data.title || slug,
      date: data.date || "1970-01-01",
      summary: data.summary || "",
      tags: data.tags || [],
      lang,
      contentHtml,
    };
  }

  return { getSlugs, getItems, getDetail };
}

export const posts = createCollection("posts");
export const projects = createCollection("projects");

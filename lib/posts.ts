import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { Language } from "@/lib/i18n";

const postsDirectory = path.join(process.cwd(), "content", "posts");

type PostMeta = {
  title: string;
  date: string;
  summary?: string;
  tags?: string[];
  lang: Language;
};

export type PostItem = PostMeta & { slug: string };
export type PostDetail = PostItem & { contentHtml: string };

function getLangDir(lang: Language) {
  return path.join(postsDirectory, lang);
}

export function getPostSlugs(lang: Language): string[] {
  const dir = getLangDir(lang);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getPosts(lang: Language): PostItem[] {
  const slugs = getPostSlugs(lang);
  const posts = slugs
    .map((slug) => {
      const fullPath = path.join(getLangDir(lang), `${slug}.md`);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);
      return {
        slug,
        title: data.title || slug,
        date: data.date || "1970-01-01",
        summary: data.summary || "",
        tags: data.tags || [],
        lang,
      } as PostItem;
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

export async function getPost(lang: Language, slug: string): Promise<PostDetail | null> {
  const fullPath = path.join(getLangDir(lang), `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const processed = await remark().use(html).process(content);
  const contentHtml = processed.toString();
  return {
    slug,
    title: data.title || slug,
    date: data.date || "1970-01-01",
    summary: data.summary || "",
    tags: data.tags || [],
    lang,
    contentHtml,
  } as PostDetail;
}

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import type { Language } from "@/lib/i18n";

const projectsDirectory = path.join(process.cwd(), "content", "projects");

type ProjectMeta = {
  title: string;
  date: string;
  summary?: string;
  tags?: string[];
  lang: Language;
};

export type ProjectItem = ProjectMeta & { slug: string };
export type ProjectDetail = ProjectItem & { contentHtml: string };

function getLangDir(lang: Language) {
  return path.join(projectsDirectory, lang);
}

export function getProjectSlugs(lang: Language): string[] {
  const dir = getLangDir(lang);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

export function getProjects(lang: Language): ProjectItem[] {
  const slugs = getProjectSlugs(lang);
  return slugs
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
      } as ProjectItem;
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getProject(lang: Language, slug: string): Promise<ProjectDetail | null> {
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
  } as ProjectDetail;
}

import type { MetadataRoute } from "next";
import { posts, projects } from "@/lib/content";
import { LANGS } from "@/lib/i18n";

const SITE_URL = "https://xinlong-li.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 每种语言下：静态页 + 全部文章 + 全部项目
  return LANGS.flatMap((lang) => {
    // 不含 /admin —— 它同时被 X-Robots-Tag 和 robots.ts 排除，
    // 出现在 sitemap 里等于自相矛盾。
    const staticPages = [
      "",
      "/blog",
      "/moments",
      "/projects",
      "/resume",
      "/contact",
    ].map((path) => ({
      url: `${SITE_URL}/${lang}${path}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.8,
    }));

    // moments 只需上面那个列表页 —— 它刻意不做详情页
    // （见 app/[lang]/moments/page.tsx 的说明）。

    const postPages = posts.getItems(lang).map((post) => ({
      url: `${SITE_URL}/${lang}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    }));

    const projectPages = projects.getItems(lang).map((project) => ({
      url: `${SITE_URL}/${lang}/projects/${project.slug}`,
      lastModified: new Date(project.date),
      changeFrequency: "yearly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...postPages, ...projectPages];
  });
}

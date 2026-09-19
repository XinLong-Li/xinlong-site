import type { MetadataRoute } from "next";
import { posts, projects } from "@/lib/content";
import { LANGS } from "@/lib/i18n";

const SITE_URL = "https://xinlong-li.site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 每种语言下：静态页 + 全部文章 + 全部项目
  return LANGS.flatMap((lang) => {
    const staticPages = ["", "/blog", "/projects", "/resume", "/contact"].map(
      (path) => ({
        url: `${SITE_URL}/${lang}${path}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: path === "" ? 1 : 0.8,
      }),
    );

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

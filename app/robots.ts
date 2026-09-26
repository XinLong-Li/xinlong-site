import type { MetadataRoute } from "next";

const SITE_URL = "https://xinlong-li.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 刻意**不**列 /admin，尽管那看起来很自然。两个理由：
      //
      // 1. 安全：robots.txt 是公开文件，写进去等于主动公告"这里有个后台"。
      //    扫 robots.txt 找攻击目标是标准手法，不写反而是收敛暴露面。
      // 2. 技术：被 Disallow 的页面爬虫不会去抓，也就读不到 next.config.js
      //    里那个 X-Robots-Tag: noindex 头，URL 反而可能带着标题出现在搜索
      //    结果里。要真正阻止收录，靠 noindex 头，不要靠 Disallow。
      disallow: ["/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

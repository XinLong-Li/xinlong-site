/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      /**
       * 这不是安全加固，恰恰相反——它**放宽**校验。
       *
       * Next 默认在 origin 与 host 不一致时拒绝 Server Action。而 nginx 若
       * 没设 `proxy_set_header Host $host`，生产环境就会出现 origin 是
       * 域名、host 是 127.0.0.1:3000 的情况，于是**所有写入都被拒绝**，
       * 表现为"点了发布没反应"、错误只在服务端日志里。这里把本站域名
       * 列入白名单作为保险。
       *
       * 真正的鉴权边界不在这里，而在每个 action 里的 requireAuth()
       * （见 app/[lang]/admin/actions.ts）——攻击者的 origin 仍会被拒绝，
       * 且跨站请求本来就带不上 SameSite=Lax 的会话 cookie。
       */
      allowedOrigins: ["xinlong-li.site", "www.xinlong-li.site"],
    },
  },

  async headers() {
    return [
      {
        /**
         * 管理后台不得被任何爬虫收录。
         *
         * 用 HTTP 头而不是只靠 robots.txt：robots.txt 的 Disallow 是"请求"
         * 而非"强制"，它只挡住守规矩的爬虫，而一条被索引的 /admin 会把
         * 登录页暴露给搜索引擎的缓存。页面上还有一道 metadata.robots，
         * 两道都留着。
         */
        source: "/:lang(zh|en)/admin",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:lang(zh|en)/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};
module.exports = nextConfig;

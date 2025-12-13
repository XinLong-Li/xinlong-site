# xinlong-site

一个最小可运行的 Next.js + Node（App Router + TypeScript）个人网站骨架：
- 左上角站点标题“Xinlong Li”
- 右侧按钮：主题切换、语言切换
- 博客模块入口（后续接入 Markdown 或数据库）
- 简易 API `/api/posts`

## 本地运行

```powershell
npm install
npm run dev
```

在浏览器打开 http://localhost:3000

## 部署
- 推荐 Vercel（免费）导入 GitHub 仓库一键部署。
- 之后可迁移到腾讯云（CVM/SCF + COS + CDN + TencentDB）。

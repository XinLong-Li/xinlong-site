# xinlong-site

李新龙 / Xinlong Li 的个人作品集站点 — 中英双语，嵌入式软件与机器人运动控制方向。

## 技术栈

- **框架**：Next.js 16（App Router + Turbopack）、React 18、TypeScript strict
- **样式**：Tailwind CSS v4（CSS-first `@theme` 配置）+ CSS 变量设计令牌
- **主题**：`next-themes`，class 策略，默认跟随系统
- **内容**：Markdown（`gray-matter` + `remark`），存放于 `content/`
- **图标**：`lucide-react`
- **部署**：腾讯云 + PM2，由 GitHub Actions 自动部署

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

其他脚本：

```bash
npm run build      # 生产构建
npm start          # 启动生产服务
npm run typecheck  # tsc --noEmit（需先跑过一次 build，见下方说明）
```

> `npm run typecheck` 依赖 `.next/types/` 下的生成类型，因此全新克隆后需先
> 执行一次 `npm run build`，否则会报找不到模块。

## 目录结构

```
app/
  [lang]/              根布局与全部页面（lang ∈ zh | en）
    layout.tsx         根布局：<html lang>、主题 Provider、导航、页脚
    page.tsx           首页
    [...rest]/         兜底路由，触发 404
    fonts/            自托管字体
  api/health/          健康检查（供 uptime 监控使用）
  globals.css          设计令牌 + 基础层
proxy.ts               根路径语言协商与重定向
components/            UI 组件
lib/
  i18n.ts              类型化字典（两种语言键不一致会在编译期报错）
  content.ts           posts / projects 两个集合的统一读取
content/{posts,projects}/{zh,en}/*.md
```

## 设计令牌

所有颜色、圆角、阴影、字体都定义在 `app/globals.css` 的 `@theme` 里，
浅色值写在 `@theme`，深色只在 `.dark` 中覆盖变量值。**布局与结构不随主题
变化** —— 这是浅深两色共享同一套设计语言的机制。

改配色只需改令牌，不要在组件里写死颜色。

## 部署

推送到 `main` 会自动触发 `.github/workflows/deploy-tencent.yml`：
在腾讯云服务器上 `git reset --hard` → `npm ci` → `npm run build` → PM2 重启。

`ecosystem.config.js` 配置 PM2（fork 模式，端口 3000）。

## 几个容易踩回去的坑

以下每一条都是实测验证过的，改动相关代码前请先读：

**1. 不要加 `app/[lang]/loading.tsx`**
它会创建 Suspense 边界，流式渲染会立即以 200 发出外壳，导致页面里
`notFound()` 设置的状态码失效 —— 所有 404 变成软 404 被搜索引擎收录。
实测：加上后 `/nonexistent` 返回 200，移除后恢复 404。

**2. 不要开启 `experimental.globalNotFound`**
该文件约定在 Turbopack（Next 16 默认构建器）上尚未实现，标志会被识别但
文件不生效。相关逻辑目前只存在于 webpack 的 `next-app-loader` 中。
未匹配路径改由 `proxy.ts` 重写进语言段 + `app/[lang]/[...rest]` 兜底。

**3. `proxy.ts` 的重定向必须是 302**
`NextResponse.redirect` 默认返回 307，而 `.github/workflows/uptime-monitor.yml`
只接受 200/301/302（`grep -q "200\|301\|302"`）。用默认值会让监控在生产
环境误报故障，且本地怎么测都测不出来。

**4. 字体必须自托管**
部署时会在腾讯云服务器上再跑一次构建，而大陆服务器通常访问不了 Google。
用 `next/font/local` + 仓库内的 woff2，构建期零网络依赖。
只取 latin 子集，中文由系统字体栈兜底（中文 webfont 是数 MB 级）。

**5. Tailwind v4 的深色模式需要 `@custom-variant`**
v4 的 `dark:` 默认跟随 `prefers-color-scheme`。用 class 策略必须写
`@custom-variant dark (&:where(.dark, .dark *));`，`.dark *` 那半段不能省。
配错的症状是在深色系统的机器上"看起来正常"，极易漏过。

**6. 不要给已有 `display` 工具类的组件传 `hidden`**
Tailwind 生成的 CSS 中 `.hidden` 排在 `.inline-flex` 之前，同等特异性下后者
胜出，类名压制无效。用包裹元素代替。带变体的 `md:hidden` 没有这个问题。

**7. 嵌套动态路由的 `generateStaticParams` 必须返回全部段**
只返回 `{ slug }` 会让构建成功但静默丢弃预渲染页面。核对构建输出中
两种语言都有页面。

**8. 不要执行 `npm audit fix` 来消除 js-yaml 告警**
`npm audit` 会报 `js-yaml@3.x`（经 `gray-matter` 传递）的若干 DoS 漏洞。
**这是不可利用的，而且"修复"会弄坏站点：**

- `gray-matter/lib/engines.js` 调用的是 `yaml.safeLoad`，这是 js-yaml 3.x 的
  API，4.x 已将其移除——强行升级会在解析 frontmatter 时抛
  `yaml.safeLoad is not a function`
- `npm audit fix --dry-run` 显示 0 个包会变更，即非破坏性修复并不存在
- 该 DoS 需要攻击者可控的 YAML 合并键。而 js-yaml 在这里只解析 `content/`
  下仓库自身提交的 markdown，没有不可信输入

可行的真正修复是等待 gray-matter 支持 js-yaml 4，或改用其他 frontmatter
解析库。

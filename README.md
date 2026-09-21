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
    blog/ moments/ projects/   三类内容
    admin/             网页端发帖后台（登录 + 编辑器 + 已发布列表）
    [...rest]/         兜底路由，触发 404
    fonts/             自托管字体
  api/health/          健康检查（供 uptime 监控使用）
  globals.css          设计令牌 + 基础层
proxy.ts               根路径语言协商与重定向
components/            UI 组件
lib/
  i18n.ts              类型化字典（两种语言键不一致会在编译期报错）
  content.ts           posts / projects / moments 的统一读写
  auth.ts              密码校验、无状态会话、登录限速
  slug.ts              slug 生成（中文标题回退到内容哈希）

content/
  posts/ projects/     仓库策展内容，git 跟踪，**只读**
  runtime/             网页端发布的内容，gitignored，可改可删
```

两类内容的读取规则：**slug 冲突时 git 版本优先**。管理界面把仓库内容
标为"仓库收录"并转为只读——删掉它下次 `git reset --hard` 会复活，编辑它
下次部署会被静默回滚。

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

**9. 网页端发帖：缓存失效的顺序不能反**
内容有两层缓存：`lib/content.ts` 里的模块级缓存，和 Next 的 ISR 路由缓存。
写入后必须**先 `clearCache()` 再 `revalidatePath()`**：

```ts
collection.clearCache();
revalidatePath(`/${lang}/blog`);
revalidatePath(`/${lang}/blog/${slug}`);   // 删除时也必须，否则留下软 404
```

`revalidatePath` 只是把路径**标记为过期**，真正的重新渲染在下一次请求。
顺序反了的话，落在两者之间的那次请求会把旧列表重新写回 ISR 缓存并附上
新的 60 秒计时器——"发布了但列表页还是旧的"，且会稳定复现。

删除时对详情页的 revalidate 尤其不能省：ISR 不会因为源文件消失而失效，
不写那行，被删的文章会以 200 继续对外服务（软 404，会被搜索引擎收录）。

**10. `content/runtime/` 必须保持被 gitignore**
网页端发布的帖子写在这里。它必须能扛过部署流程里的 `git reset --hard`
——那条命令只重置**已跟踪**文件。一旦有人 `git add -A` 把它提交进去，
这个保证就静默失效了。用 `git check-ignore -v content/runtime/...` 正面确认。

**11. 服务器必须先配好 `.env`，否则登录永远失败**
```
ADMIN_PASSWORD_HASH="<salt-hex>:<scrypt-key-hex>"
SESSION_SECRET="<openssl rand -hex 32>"
```
生成哈希：
```bash
node -e 'const{scryptSync,randomBytes}=require("node:crypto");const s=randomBytes(16);const k=scryptSync(process.argv[1],s,64);console.log(s.toString("hex")+":"+k.toString("hex"))' '你的密码'
```
写完重启即可：`pm2 restart xinlong-site`。

**关于 `--update-env`**：对 `.env` 文件里的值**不需要**——Next 在进程启动时
自己会读项目根目录的 `.env`（`next start` 内置了这一步），PM2 的环境快照
与它无关。实测：不导出任何 shell 变量、只靠 `.env`，登录正常；把 `.env`
移走后重启，登录立即失效并在服务端日志打出"未配置"。
只有当你把变量 `export` 在 SSH 会话里时，才需要 `--update-env` 让 PM2 捡到。

缺 `ADMIN_PASSWORD_HASH` 时登录会失败，而且**看起来就像密码输错了**。
服务端日志里"未配置"和"密码不匹配"是两条不同的消息，先看日志再去怀疑密码：

```
[auth] ADMIN_PASSWORD_HASH 未配置，登录不可能成功
```

**12. 局域网调试要用 `INSECURE_COOKIES=1`**
会话 cookie 在 `NODE_ENV=production` 下带 `Secure`。localhost 是安全上下文
所以不受影响，但**局域网 IP 不是**——用 `npm start` 后从手机访问
`http://192.168.x.x:3000` 时 cookie 会被浏览器丢弃，表现为"登录了但一刷新
又回到登录页"。那种场景设 `INSECURE_COOKIES=1`。

**13. `Buffer` 不能直接传给 `node:crypto`**
tsconfig 的 `lib` 同时含 `dom` 与 Node types，两套 lib 各自声明了一份
`Uint8Array`（DOM 那份的 `entries()` 返回 `IterableIterator`，ES 那份返回
TypeScript 5.6 引入的 `ArrayIterator`）。`Buffer` 继承 DOM 那份，而
`node:crypto` 的签名期望另一份，于是 `Buffer` 不满足 `BinaryLike`。
`skipLibCheck` 盖不住——那是赋值兼容性，不是 lib 内部错误。
`lib/auth.ts` 里用 `bytes()` 转成干净的 `Uint8Array` 消解。

**14. `experimental.serverActions.allowedOrigins` 不是安全加固**
它**放宽**校验，允许本会被拒绝的 origin。加它是因为 nginx 若没设
`proxy_set_header Host $host`，会出现 origin 与 host 不一致，Next 会拒绝
**所有** Server Action，表现为"点了发布没反应"且错误只在服务端日志里。
真正的鉴权边界在每个 action 里的 `requireAuth()`。

**15. 网页端发布的内容没有备份**
`content/runtime/` 只存在于那一台服务器上。定期 `scp -r <APP_DIR>/content/runtime ./backup/`。
这是"发布不依赖部署链路"换来的代价——部署链路的 `git fetch` 会间歇性
被 TLS 重置（`GnuTLS recv error`），所以发布必须绕开它。

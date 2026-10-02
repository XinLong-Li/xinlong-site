# xinlong-site

李新龙 / Xinlong Li 的个人作品集站点 — 中英双语，嵌入式软件与机器人运动控制方向。

## 技术栈

- **框架**：Next.js 16（App Router + Turbopack）、React 18、TypeScript strict
- **样式**：Tailwind CSS v4（CSS-first `@theme` 配置）+ CSS 变量设计令牌
- **主题**：`next-themes`，class 策略，默认跟随系统
- **内容**：Markdown（`gray-matter` + `remark`），存放于 `content/`
- **图标**：`lucide-react`
- **部署**：GitHub Actions 在 runner 上构建 → 推 standalone 产物 → 腾讯云 + PM2

## 本地运行

```bash
npm install
npm run dev        # http://localhost:3000
```

其他脚本：

```bash
npm run build             # 生产构建
npm start                 # 启动生产服务
npm run typecheck         # tsc --noEmit（需先跑过一次 build，见下方说明）

# 部署链路，平时用不到，排查部署问题时用
npm run build:standalone  # 产出部署用的自包含应用（等价于 BUILD_STANDALONE=1 npm run build）
npm run package:release   # 打成 release.tar.gz
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
    admin/             网页端发帖后台（登录 + 编辑器；写入直接提交 GitHub）
    [...rest]/         兜底路由，触发 404
    fonts/             自托管字体
  api/health/          健康检查（供 uptime 监控使用）
  globals.css          设计令牌 + 基础层
proxy.ts               根路径语言协商与重定向
components/            UI 组件
scripts/
  package-release.sh   在 runner 上把构建产物打成 release.tar.gz
  deploy-release.sh    在服务器上铺开产物、重启、健康检查（经 stdin 送达）
lib/
  i18n.ts              类型化字典（两种语言键不一致会在编译期报错）
  content.ts           posts / projects / moments 的统一读写
  auth.ts              密码校验、无状态会话、登录限速
  slug.ts              slug 生成（中文标题回退到内容哈希）

content/
  posts/ projects/     仓库策展内容，git 跟踪，**只读**
  runtime/             【遗留】旧的运行时发布机制留下的草稿，只读；
                       编辑一次即提交进 git，下次部署后由脚本清理
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

推送到 `main` 会自动触发 `.github/workflows/deploy-tencent.yml`。

**在 GitHub runner 上构建，把产物推给服务器。服务器不访问外网，也没有 git 仓库的角色。**

```
push → runner: npm ci → BUILD_STANDALONE=1 npm run build → package-release.sh
                ↓ 两个 tar 流，直接喂给远端的 cat
             服务器: 解压 .release/ → 校验 → 换依赖 → 换 content → 换应用 → 重启 → 健康检查
```

### 产物分两层，因为上传很慢

实测 **GitHub runner → 腾讯云的上传只有约 16–20 KB/s**：17MB 传了 **15 分 22 秒**
（测了三次，都是这个量级，跟时段无关）。而 17MB 里有 15MB 是 `node_modules`，
它只在依赖变化时才需要更新。所以拆成两层：

| 层 | 内容 | 大小 | 什么时候传 |
|---|---|---|---|
| 应用层 | `server.js` / `.next` / `public` / `content` / PM2 配置 | **1.5 MB** | 每次都传 |
| 依赖层 | `node_modules` | 15 MB | 只在指纹变化时传 |

指纹是对 `node_modules` 的**路径+内容**取的 sha256，记在服务器的 `.deps-hash` 里。
**刻意不对 tar 包取哈希** —— gzip 头和 mtime 每次构建都不同，那样每次都会判定成
"依赖变了"，这个优化就白做了。

实测数据（同一台服务器，相隔一小时）：

| | 上传耗时 | 整次部署 |
|---|---|---|
| 依赖也变了（传 16MB） | 16 分 09 秒 | 约 18 分钟 |
| **只是发文章**（传 1.5MB） | **1 分 42 秒** | **约 1 分 50 秒** |

也就是说日常发文是约 2 分钟，而不是 16 分钟。依赖变化（比如升级 Next）
才需要付那 16 分钟，而那件事一个月也未必有一次。

指纹在两次独立的 CI 构建之间对上了（`a07ceb30…`），所以这个跳过是可靠的，
不是在本地凑出来的巧合。

指纹对不上而依赖层又没上传时，服务器**拒绝部署**而不是硬着头皮上 ——
让新代码跑在旧依赖上，会以完全无关的运行时错误出现，那种错很难查。

`npm run package:release` 的输出：

```
OK  release-app.tar.gz (1.5M)
OK  release-deps.tar.gz (15M)
OK  release-deps.hash (6d9aa36d…)
```

### 为什么不是"SSH 上去 git reset + npm ci + npm build"

那套要**服务器主动访问 github.com**，而这条跨境链路会被 TLS 间歇重置：

```
GnuTLS recv error (-110): The TLS connection was non-properly terminated
curl 16 Error in the HTTP2 framing layer
Failed to connect to github.com port 443 after 130321 ms
```

实测成功率大约一半，且和代码完全无关。重跑能过，但**内容统一走 git 之后，
每保存一篇文章都会触发一次部署** —— 部署不稳定就等于发文不稳定。

改成推产物之后，服务器只被动接收一个文件，`git fetch` / `npm ci` / `next build`
全部消失，这一类故障从根上没有了。

### 三个脚本的分工

| 文件 | 在哪跑 | 为什么分开 |
|---|---|---|
| `scripts/package-release.sh` | runner | 唯一能在本地验证的一段，所以逻辑尽量放这里 |
| `scripts/deploy-release.sh` | 服务器（**经 stdin，不存在于服务器磁盘**） | 版本化、能在本地跑真实目录验证，也没有"首次部署时脚本还不存在"的问题 |
| `.github/workflows/deploy-tencent.yml` | runner | 只剩下编排：装依赖、构建、打包、传、调用上面两个 |

部署脚本刻意**不做**的事：不碰 `.env`、不碰 `content/runtime/`、不碰 `logs/`。
解压与校验都发生在替换之前，所以任何一步失败，服务器仍在跑旧版本。

本地复现整条链路：

```bash
npm run build:standalone
npm run package:release        # 产出 release.tar.gz
```

### PM2

`ecosystem.config.js` 配置 PM2（fork 模式，端口 3000）。**入口是 standalone 产物自带的
`server.js`，不是 `next` CLI** —— 服务器上已经没有 `node_modules/.bin/next` 了。

`.env` 里的三个键**不写在 PM2 的 `env:` 块里**：`server.js` 走 Next 的 `BaseServer`，
构造时无条件调用 `loadEnvConfig(dir)`，会自己把项目根目录的 `.env` 读进
`process.env`。两处都写会引入优先级歧义，而症状是"密码明明改了却登不上"。

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
用 `next/font/local` + 仓库内的 woff2，构建期与运行期都不依赖 Google。
（构建已经从腾讯云服务器挪到了 GitHub runner，那条"服务器连不上 Google"
的理由不再成立；但自托管仍然是对的：访客不必再去第三方拉字体，也少一次
渲染阻塞。构建的确定性顺带保住了 —— 不依赖外网就不会因为外网抽风而失败。）
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

那套「运行时发布」机制已经拆掉了 —— 内容现在一律提交 git。但服务器磁盘上
还留着当初从后台发的几篇草稿，读路径仍然会读它们（否则内容会从站点消失）。

**它只活在服务器上，这一点由两道独立机制保证**，所以比原来更稳：

- `scripts/package-release.sh` 重建 `content/` 时只从 `posts` / `moments` /
  `projects` 三棵树里取，产物里永远不会有 `runtime`；`deploy-release.sh`
  还会在解压后正面断言一次，发现就拒绝部署
- `deploy-release.sh` 替换 content 时只删上面那三个目录，`content/runtime`
  不在其中，所以原封不动

仍然要 gitignore 的原因变了：不再是"扛过 `git reset --hard`"（那条命令已经
不在链路里了），而是**本地开发时的 `content/runtime/` 和服务器上的不是同一批
文件**。把它提交上去只会往仓库里塞进本地的临时草稿。

`[4/8] 清理已归档的草稿` 会在每次部署后删掉那些 slug 已经出现在新产物里的
runtime 副本 —— 不删的话，哪天从 git 删掉一篇文章，runtime 副本会让它复活。

**11. `.env` 由工作流派生，缺了它登录永远失败**

`.env` **不手工创建**，由 GitHub Secrets 声明式生成：

```
GitHub Secrets（加密，只写不读）
   ↓ 部署时 scripts/deploy-release.sh 的 [6/8]
服务器 $APP_DIR/.env（600 权限，被 gitignore）
   ↓ server.js 启动时由 Next 的 loadEnvConfig 读取
lib/auth.ts（登录） / lib/github.ts（云端保存）
```

| Secret | 缺了会怎样 |
|---|---|
| `ADMIN_PASSWORD_HASH` | **登录永远失败**，且症状伪装成"密码不对" |
| `SESSION_SECRET` | 签发会话时抛错，登录 500 |
| `SITE_SYNC_TOKEN` | 站点照常跑，**后台能看不能存**，页面顶部会写明原因 |

前两个必须**同时**配置（只配一个会被 Preflight 拦下）。第三个独立可选。
两个都没配时走 SKIP 分支，服务器上现有的 `.env` 保持原样。

改密码：本地生成新哈希 → 覆盖 GitHub 上那个 Secret → 触发一次部署。
生成哈希：

```bash
printf '设置后台密码（输入时不显示）: '; read -s PW; echo
printf '%s' "$PW" | node -e 'let p="";process.stdin.on("data",function(d){p+=d});process.stdin.on("end",function(){var c=require("node:crypto");var s=c.randomBytes(16),k=c.scryptSync(p,s,64);console.log(s.toString("hex")+":"+k.toString("hex"))})'
unset PW
```

已签发会话最长 7 天（无状态 cookie 收不回）。要立即踢掉所有会话，就同时覆盖
`SESSION_SECRET` —— 所有人重新登录，包括你自己。

**关于 `--update-env`**：不需要。`server.js` 是 Next 的 standalone 入口，走的是
`BaseServer`，构造时无条件调用 `loadEnvConfig(dir)`（`dir` 就是 `server.js`
所在目录，也就是项目根）。PM2 的 `env:` 块里刻意**不**放这三个键。

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

**15. 内容现在全部在 git 里，不再有「只存在服务器上」的东西**

这一条以前是「网页端发布的内容没有备份」。改成提交 git 之后这个缺口消失了 ——
本地写和云端写是同一批文章，都在仓库里。
代价是发布要等一次部署（1–2 分钟），而部署的可靠性由「在 runner 上构建、
推产物」保证，见上面「部署」一节。

**16. 后台保存需要 `SITE_SYNC_TOKEN`**

后台的保存/删除**直接调 GitHub Contents API**，不经过服务端。原因是这台
腾讯云服务器访问不了 GitHub —— 会被 TLS 间歇重置，push 走的是和 `git fetch`
同一条跨境链路。这也正是部署改成"在 runner 上构建"的原因，见「部署」一节。

token 是 fine-grained PAT：

- Repository access：仅 `xinlong-li/xinlong-site`
- Permissions：**Contents: Read and write**（必须）
- 存成仓库 Secret `SITE_SYNC_TOKEN`，部署时由工作流写进服务器 `.env`

**为什么叫 `SITE_SYNC_TOKEN` 而不是 `GITHUB_SYNC_TOKEN`** —— 这个名字不能改。

GitHub **把 `GITHUB_` 前缀整个保留了**，`GITHUB_TOKEN`、`GITHUB_ACTOR` 这些内置
变量占着。这个限制**同时作用于 Secret 名和 workflow 里的环境变量名**：

- Secret：直接拒绝保存，报 `Secret names must not start with GITHUB_.`
- （服务端和 `.env` 里叫什么是无所谓的，`process.env` 不受这条限制；但为了
  三处名字一致、不让人困惑，统一用 `SITE_SYNC_TOKEN`）

所以它叫 `SITE_SYNC_TOKEN` 是**被迫的**，不是随手起的。看到它"不够直白"时
不要好心改回 `GITHUB_` 开头 —— 改了会连 Secret 都存不进去。

**它会过期。** 到期后后台保存会失败，出错信息是 GitHub 返回的
`HTTP 401 Bad credentials（token 可能已过期或被撤销）`—— 看到 401 先去
检查 token，不要怀疑密码或网络。续期就是新建一个 token 覆盖这个 Secret。
所以建 token 时**有效期选最长**：30 天的话一个月后发文功能会静默断掉，
而症状伪装成"密码不对"。

**未配置时**：站点照常运行，后台能看不能存，页面顶部会明确写出原因。
`getRepoRefAction` 对这种情况**返回**错误而不是抛 —— server action 抛出的
异常在生产构建里会被 React 包装成 `Minified React error #441`，用户看到的
是一个错误码而不是"去哪里配 token"。预期内的失败一律返回，不抛。

**本地开发**：在 `.env` 里加 `SITE_SYNC_TOKEN="github_pat_..."` 即可；
不加的话后台会按"未配置"处理，不影响其他功能。

**17. 打包产物时必须排除 `.env` —— Next 会把它复制进 `.next/standalone`**

Next 的输出追踪会把项目根目录的 `.env` 一起复制到 standalone 目录里。实测确认。

原因是 `lib/content.ts` 里有 `path.join(process.cwd(), "content", ...)` 这类
**动态文件系统访问**，Turbopack 无法静态推断会读哪些文件，于是保守地把整个
项目都纳入追踪（构建时会打出 `Dynamic filesystem access causes tracing of the
whole project`，那句话说的就是这件事）。`.env`、`app/`、`lib/` 这些因此都在
`.next/standalone/` 里。

如果打包时不管它，解压到服务器上就会**覆盖服务器那份真正的 `.env`**：登录
会用一个本地测试密码，而且本地密钥被推到了线上。症状是"部署完之后密码突然
不对了"，而没有任何一步报错。

`package-release.sh` 里先 `rm -f` 再正面断言，`deploy-release.sh` 解压后再断言
一次 —— 两道闸门，且都是**拒绝部署**而不是警告。

**18. `$VAR` 后面紧跟中文标点会被 bash 当成变量名的一部分**

不是笔误，是真实踩到并且会让**每一次部署都失败**的坑：

```bash
PORT=2222
echo "$PORT（括号）"     # bash: PORT<乱码>: unbound variable
echo "${PORT}（括号）"   # 2222（括号）
```

bash 的变量名解析会把紧随其后的多字节字符吃进去。配合 `set -u`，脚本直接
以 "unbound variable" 终止。脚本正文里凡是中文出现在变量后面的地方，
**一律写成 `${VAR}`**。用这条找残留：

```bash
grep -rnP '\$[A-Za-z_][A-Za-z0-9_]*(?=[^\x00-\x7F])' scripts/ .github/workflows/
```

**19. `output: 'standalone'` 由 `BUILD_STANDALONE=1` 控制，不是常开**

部署需要 standalone 产物，但无条件打开会让每次本地构建都多产出一份
`.next/standalone`，并且 `npm start` 每次打出 `"next start" does not work
with "output: standalone"` 的警告（`next/dist/server/next.js` —— 只是警告，
功能正常）。所以本地 `npm run build` 与 `npm start` 保持原样，只有工作流和
`npm run build:standalone` 走 standalone。

另一个容易搞反的点：**standalone 产物不含 `.next/static` 和 `public`**。
Next 不会自动带上它们，必须手工复制进去 —— 漏了的表现是页面能打开但完全
没有样式。

服务器上那个 `.git/` 目录是上一套部署方式留下的，现在没有任何东西会读它。
留着无害，可以随手删掉。

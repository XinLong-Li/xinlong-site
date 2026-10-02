#!/usr/bin/env bash
#
# 把一次 standalone 构建的产物打成一个可以整个覆盖到服务器上的 release.tar.gz。
#
# 为什么要有这个脚本：部署改成「在 GitHub runner 上构建 → 把产物推给服务器」，
# 服务器从此不再访问 github.com。原来那套 `git fetch` + `npm ci` + `npm run build`
# 走的是服务器 → GitHub 的跨境链路，会被 TLS 间歇重置（GnuTLS recv error /
# HTTP2 framing error），随机失败且失败率不低。
#
# 它是整条部署链路里**唯一能在本地跑**的一段，所以尽量把逻辑放在这里而不是
# 塞进 YAML —— 塞进 YAML 的部分只能靠线上试错。
#
# 用法：
#   BUILD_STANDALONE=1 npm run build
#   bash scripts/package-release.sh          # 产出 release.tar.gz
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SRC=".next/standalone"
OUT="release.tar.gz"
STAGE=".release-stage"

if [ ! -d "$SRC" ]; then
  echo "ERROR: 找不到 ${SRC}。" >&2
  echo "       先跑 BUILD_STANDALONE=1 npm run build（或 npm run build:standalone）。" >&2
  exit 1
fi

rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"

# --- 1. standalone 里的那一份应用 -----------------------------------------
# 含 server.js、精简过的 node_modules、.next/server（含预渲染页面与 middleware）。
cp -a "$SRC"/. "$STAGE"/

# --- 2. standalone 不含、但运行时要用的两样 -------------------------------
# .next/static 是客户端 JS/CSS；public 是图标与静态资源。Next 不会自动带上它们，
# 漏了的表现是页面能打开但完全没有样式。
mkdir -p "$STAGE/.next"
cp -a .next/static "$STAGE/.next/static"
cp -a public "$STAGE/public"

# --- 3. 内容 -----------------------------------------------------------------
# **重建整个 content/，只从仓库跟踪的三棵树里取。**
# 这样天然排除 content/runtime —— 那份遗留草稿属于服务器，不属于产物。
# 本地开发时的 content/runtime 和服务器上的不是同一批文件，混进产物等于往
# 线上塞进本不该存在的文章。
rm -rf "$STAGE/content"
mkdir -p "$STAGE/content"
for d in posts moments projects; do
  if [ -d "content/$d" ]; then
    cp -a "content/$d" "$STAGE/content/$d"
  fi
done

# --- 4. PM2 配置 -------------------------------------------------------------
cp -a ecosystem.config.js "$STAGE/ecosystem.config.js"

# --- 5. 硬性检查 -------------------------------------------------------------
# 下面每一条都是「一旦漏掉、线上会以很难查的方式坏掉」的东西。

# Next 的输出追踪会把项目根目录的 .env 复制进 .next/standalone —— 实测确认过。
# 带上它的话，解压时会覆盖服务器那份真正的 .env：登录会用本地测试密码，
# 而且本地密钥被推到了线上。这里删掉之后还要再断言一次。
rm -f "$STAGE/.env"
if [ -e "$STAGE/.env" ]; then
  echo "ERROR: 产物里出现了 .env。" >&2
  echo "       它会覆盖服务器的凭据，拒绝打包。" >&2
  exit 1
fi

if [ -d "$STAGE/content/runtime" ]; then
  echo "ERROR: 产物里出现了 content/runtime。" >&2
  echo "       那是服务器的遗留草稿，混进来会污染线上内容，拒绝打包。" >&2
  exit 1
fi

for f in server.js package.json .next/BUILD_ID .next/static ecosystem.config.js content/posts; do
  if [ ! -e "$STAGE/$f" ]; then
    echo "ERROR: 产物缺少 ${f}。" >&2
    exit 1
  fi
done

# --- 6. 打包 -----------------------------------------------------------------
# 用 gzip 而不是 zstd/xz：服务器上不保证有对应的解压工具，gzip 一定有。
tar czf "$OUT" -C "$STAGE" .
rm -rf "$STAGE"

echo "OK: $OUT ($(du -h "$OUT" | cut -f1 | tr -d ' '))"

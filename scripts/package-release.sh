#!/usr/bin/env bash
#
# 把一次 standalone 构建的产物打成两个包：
#
#   release-app.tar.gz    应用本体（server.js / .next / public / content / PM2 配置）
#   release-deps.tar.gz   node_modules
#   release-deps.hash     依赖层内容的指纹，用于判断要不要重传
#
# **为什么要拆成两层**：实测 GitHub runner → 腾讯云的上传只有约 19 KB/s
# （17MB 传了 15 分 22 秒）。而 17MB 里有 15MB 是 node_modules，它只在
# 依赖变化时才需要更新；发一篇文章真正变的是应用层，只有 1MB 出头。
# 拆开之后，日常发文只需要传应用层。
#
# 为什么部署改成推产物，见 README「部署」一节。
#
# 它是整条部署链路里**唯一能在本地跑**的一段，所以逻辑尽量放在这里而不是
# 塞进 YAML —— 塞进 YAML 的部分只能靠线上试错。
#
# 用法：
#   BUILD_STANDALONE=1 npm run build
#   bash scripts/package-release.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SRC=".next/standalone"
APP_OUT="release-app.tar.gz"
DEPS_OUT="release-deps.tar.gz"
HASH_OUT="release-deps.hash"
STAGE=".release-stage"

if [ ! -d "$SRC" ]; then
  echo "ERROR: 找不到 ${SRC}。" >&2
  echo "       先跑 BUILD_STANDALONE=1 npm run build（或 npm run build:standalone）。" >&2
  exit 1
fi

# 跨平台的 sha256：runner 上是 GNU coreutils，本机 macOS 上是 perl 的 shasum。
if command -v sha256sum >/dev/null 2>&1; then
  SHA="sha256sum"
else
  SHA="shasum -a 256"
fi

# 对一棵目录树取"路径 + 内容"的指纹。
#
# **不能直接对 tar 包取哈希**：gzip 头和 mtime 每次构建都不同，那样每次都会
# 判定成"依赖变了"，重传 15MB，这个优化就白做了。所以按排序后的路径逐文件
# 取哈希 —— 与归档格式、时间戳、遍历顺序都无关。
hash_tree() {
  ( cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 $SHA ) | $SHA | cut -d' ' -f1
}

echo "[-] 计算依赖层指纹"
DEPS_HASH="$(hash_tree "$SRC/node_modules")"

rm -rf "$STAGE" "$APP_OUT" "$DEPS_OUT" "$HASH_OUT"
mkdir -p "$STAGE"

# --- 1. standalone 里的那一份应用 -----------------------------------------
# 含 server.js、.next/server（预渲染页面与 middleware）。node_modules 单独成层，
# 这里**不带**它。
echo "[-] 组装应用层"
mkdir -p "$STAGE"
( cd "$SRC" && tar cf - --exclude=./node_modules . ) | ( cd "$STAGE" && tar xf - )

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
  echo "ERROR: 产物里出现了 .env —— 它会覆盖服务器的凭据，拒绝打包。" >&2
  exit 1
fi

if [ -d "$STAGE/content/runtime" ]; then
  echo "ERROR: 产物里出现了 content/runtime —— 那是服务器的遗留草稿，拒绝打包。" >&2
  exit 1
fi

if [ -d "$STAGE/node_modules" ]; then
  echo "ERROR: 应用层里混进了 node_modules —— 它应该单独成层，拒绝打包。" >&2
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
echo "[-] 打包应用层"
tar czf "$APP_OUT" -C "$STAGE" .

echo "[-] 打包依赖层"
tar czf "$DEPS_OUT" -C "$SRC" node_modules

printf '%s\n' "$DEPS_HASH" > "$HASH_OUT"
rm -rf "$STAGE"

printf 'OK  %s (%s)\n' "$APP_OUT"  "$(du -h "$APP_OUT"  | cut -f1 | tr -d ' ')"
printf 'OK  %s (%s)\n' "$DEPS_OUT" "$(du -h "$DEPS_OUT" | cut -f1 | tr -d ' ')"
printf 'OK  %s (%s)\n' "$HASH_OUT" "$DEPS_HASH"

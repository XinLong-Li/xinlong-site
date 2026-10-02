#!/usr/bin/env bash
#
# 在腾讯云服务器上把 release.tar.gz 铺开、重启 PM2、做健康检查。
#
# 这个文件**不需要存在于服务器上**：工作流用
#     { 变量声明; cat scripts/deploy-release.sh; } | ssh <host> "bash -s -- '$APP_DIR'"
# 把它从 runner 的 checkout 直接喂给远端 bash 的 stdin。这样它是版本化的、
# 能在本地用真实目录跑一遍，也不存在"第一次部署时脚本还不存在"的先有鸡先有蛋。
#
# 进来之前工作流已经：构建好、打好包、把 release.tar.gz 传到 ${APP_DIR}。
# ADMIN_PASSWORD_HASH / SESSION_SECRET / GITHUB_SYNC_TOKEN 由工作流以 shell
# 变量声明的形式拼在脚本前面（见 deploy-tencent.yml）—— 走 stdin 而不是命令行
# 参数，服务器上 `ps` 看不到它们。
#
# 本脚本刻意不做的事：
#   - 不做 git fetch / npm ci / npm run build（那条跨境链路就是本次改造要绕开的）
#   - 不碰 content/runtime/（那批遗留草稿只存在于这台机器上）
#   - 不碰 logs/
#
set -euo pipefail

APP_DIR="${1:-}"
if [ -z "$APP_DIR" ]; then
  echo "ERROR: 用法: deploy-release.sh <APP_DIR>" >&2
  exit 1
fi
if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: 目录不存在: $APP_DIR" >&2
  exit 1
fi
cd "$APP_DIR"

ARCHIVE="release.tar.gz"
STAGE=".release"

# --- 1. 解压到暂存目录 -------------------------------------------------------
# 全程先在 $STAGE 里解压、校验，**确认无误之后才动现有的应用**。
# 任何一步失败都在这里退出，服务器保持原样跑旧版本。
echo "[1/8] 解压到 $STAGE"
if [ ! -f "$ARCHIVE" ]; then
  echo "ERROR: 找不到 ${ARCHIVE}（上传步骤应该失败了）" >&2
  exit 1
fi
rm -rf "$STAGE"
mkdir -p "$STAGE"
tar xzf "$ARCHIVE" -C "$STAGE"
rm -f "$ARCHIVE"

# --- 2. 校验 -----------------------------------------------------------------
echo "[2/8] 校验产物"
for f in server.js package.json .next/BUILD_ID .next/static .next/server ecosystem.config.js content/posts; do
  if [ ! -e "$STAGE/$f" ]; then
    echo "ERROR: 产物缺少 $f —— 放弃部署，服务器未被改动" >&2
    exit 1
  fi
done

# 下面两条是防"打错包"的闸门。注意必须用 if 而不是 `[ ... ] && exit`：
# 后者在条件为假时整条语句返回非零，set -e 会直接把脚本打死 —— 一个
# 看起来通过、实际提前退出的部署。
if [ -e "$STAGE/.env" ]; then
  echo "ERROR: 产物里带 .env，会覆盖服务器凭据 —— 拒绝部署" >&2
  exit 1
fi
if [ -d "$STAGE/content/runtime" ]; then
  echo "ERROR: 产物里带 content/runtime，会污染线上内容 —— 拒绝部署" >&2
  exit 1
fi
echo "  ok"

# --- 3. 换内容 ---------------------------------------------------------------
# 只替换仓库跟踪的三棵树。content/runtime 不在其中，所以原封不动。
echo "[3/8] 替换 content/"
rm -rf content/posts content/moments content/projects
mkdir -p content
cp -a "$STAGE/content/." content/

# --- 4. 清理已归档的遗留草稿 -------------------------------------------------
# content/runtime/ 是旧的"运行时发布"机制留下的。内容现在一律走 git，某篇草稿
# 一旦在新产物里出现，磁盘上就有两份副本；读路径 git 优先，所以内容是对的，
# 但那份 runtime 副本是隐患 —— 哪天从 git 删掉这篇文章，它会复活。
# 注意用 find 而不是通配符：没有匹配时某些 shell 会直接报错退出。
echo "[4/8] 清理已归档的草稿"
if [ -d content/runtime ]; then
  find content/runtime -type f -name '*.md' | while read -r f; do
    rel="${f#content/runtime/}"
    if [ -f "content/$rel" ]; then
      rm -f "$f"
      echo "  pruned: $rel"
    fi
  done
fi
echo "  done"

# --- 5. 换应用 ---------------------------------------------------------------
# 先删后 mv：mv 在同一个文件系统内是改名，瞬间完成、不会因为磁盘空间失败。
# 真正花时间的是第 1 步的解压，那一步已经完整做完并校验过了。
echo "[5/8] 替换应用"
rm -rf .next node_modules public
mv "$STAGE/.next" .next
mv "$STAGE/node_modules" node_modules
mv "$STAGE/public" public
mv "$STAGE/server.js" server.js
mv "$STAGE/package.json" package.json
mv "$STAGE/ecosystem.config.js" ecosystem.config.js
rm -rf "$STAGE"

# --- 6. 写 .env ---------------------------------------------------------------
# .env 由工作流**声明式**拥有：改密码 / 换 token 就是覆盖对应的 GitHub Secret
# 再部署一次，不需要登服务器。没有配这两个 Secret 时走 SKIP 分支，文件保持原样。
#
# 写法上比原来严格两点：
#   1. 先写 .env.new 再 mv 过去 —— mv 是原子的。原来的 `printf > .env` 是就地
#      截断，中途失败会留下一个半截文件，而症状是"密码明明改了却登不上"。
#   2. 写完先自检再把文件换上去。
echo "[6/8] 写 .env（hash=$([ -n "${ADMIN_PASSWORD_HASH:-}" ] && echo yes || echo no) session=$([ -n "${SESSION_SECRET:-}" ] && echo yes || echo no) token=$([ -n "${GITHUB_SYNC_TOKEN:-}" ] && echo yes || echo no))"

if [ -n "${ADMIN_PASSWORD_HASH:-}" ] && [ -n "${SESSION_SECRET:-}" ]; then
  ( umask 077; printf '%s\n%s\n' \
      "ADMIN_PASSWORD_HASH=\"$ADMIN_PASSWORD_HASH\"" \
      "SESSION_SECRET=\"$SESSION_SECRET\"" > .env.new )
  if [ -n "${GITHUB_SYNC_TOKEN:-}" ]; then
    printf '%s\n' "GITHUB_SYNC_TOKEN=\"$GITHUB_SYNC_TOKEN\"" >> .env.new
    echo "  token 已追加"
  else
    echo "  没有 GITHUB_SYNC_TOKEN，跳过（后台只能看不能存）"
  fi
  chmod 600 .env.new

  for k in ADMIN_PASSWORD_HASH SESSION_SECRET; do
    if ! grep -q "^$k=" .env.new; then
      echo "ERROR: 新写的 .env 缺少 $k —— 保留旧的，放弃替换" >&2
      rm -f .env.new
      exit 1
    fi
  done

  mv .env.new .env
  echo "  OK: .env 已更新（$(wc -c < .env | tr -d ' ') 字节）"
else
  echo "  SKIP: 没配 ADMIN_PASSWORD_HASH / SESSION_SECRET，.env 保持原样"
fi

# --- 7. 重启 -----------------------------------------------------------------
# 先 delete 再 start，而不是 startOrRestart：启动方式从 `next start` 换成了
# `node server.js`，PM2 有时不会根据配置文件的变化更新已存在进程的 script。
echo "[7/8] 重启 PM2"
mkdir -p logs
if ! command -v pm2 >/dev/null 2>&1; then
  npm i -g pm2
fi
pm2 delete xinlong-site >/dev/null 2>&1 || true
pm2 start ecosystem.config.js --env production
pm2 save

# --- 8. 健康检查 -------------------------------------------------------------
# 只验证"进程起来了、能响应"。**不验证 .env 是否被读到** —— 那需要一个暴露
# 配置状态的端点，而这个端点若公开，就等于对外播报后台配置情况。
# 配置是否正确由你登录一次确认，见 README。
echo "[8/8] 健康检查"
for _ in $(seq 1 10); do
  if curl -fsS --max-time 5 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
    echo "  OK: /api/health 有响应"
    echo "DONE"
    exit 0
  fi
  sleep 2
done

echo "ERROR: 重启后 20 秒内健康检查未通过 —— 看下面的日志" >&2
pm2 logs xinlong-site --lines 40 --nostream >&2 || true
exit 1

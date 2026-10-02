/**
 * 服务端专用。只负责把 token 和仓库坐标交给调用方 ——
 * 实际的 GitHub 调用发生在浏览器里，见 lib/github-client.ts。
 *
 * 为什么提交必须由浏览器发起：服务器推不了 GitHub。这台腾讯云服务器
 * 访问 github.com 会被 TLS 间歇重置（部署流程里 `git fetch` 那个老问题），
 * push 走的是同一条链路，所以服务端提交这条路直接排除。
 */

const OWNER = "XinLong-Li";
const REPO = "xinlong-site";

export type RepoRef = {
  owner: string;
  repo: string;
  token: string;
};

/**
 * 读 token。未配置时抛**明确**的错误 —— 不要退化成空串，
 * 那会让 401 伪装成"保存失败"，又变成靠猜的故障。
 */
export function getRepoRef(): RepoRef {
  const token = process.env.GITHUB_SYNC_TOKEN;
  if (!token) {
    throw new Error(
      "GITHUB_SYNC_TOKEN 未配置。在仓库 Secrets 里加上它，然后重新部署一次。",
    );
  }
  return { owner: OWNER, repo: REPO, token };
}

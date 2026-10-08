/**
 * URL 协议白名单 —— 把换管线时丢掉的那层净化补回来。
 *
 * 从 `remark-html` 换到 `remark-rehype` + `rehype-stringify` 会丢掉一层保护：
 * remark-html **默认是净化的**（lib/content.ts 里原先那句"remark-html 不做净化"
 * 是错的：实测 `[x](javascript:alert(1))` 经它渲染后是 `<a>x</a>`，href 被摘掉），
 * 而 rehype 管线的默认行为是原样输出 `href="javascript:alert(1)"`。
 *
 * 白名单是从 remark-html 的实际行为里逐条实测反推出来的，不是自己定的规则 ——
 * 目的正是让"换管线"这件事对已有内容零行为差异：
 *
 *   href   http / https / mailto / irc / xmpp
 *   src    http / https
 *   没有协议的（相对路径、锚点、查询串、`//host`）一律放行
 *
 * 与 hast-util-sanitize 的实际实现有一处刻意不同：**比较协议时不区分大小写**。
 * 它是区分大小写的，于是 `HTTP://a.com` 的 href 会被摘掉 —— 那更像它的疏漏，
 * 不是值得保持的行为。放宽的只是"已知安全协议的大小写写法"，而危险协议
 * （`javascript:` / `data:` / `vbscript:`）两种写法都拦得住。
 *
 * 为什么不直接用 rehype-sanitize：它会按默认 schema 把 hljs 的 class、`language-*`
 * 和我们注入的复制按钮一并清掉，得再维护一份 schema；而这里本就没有不可信输入
 * （能进 content/ 的只有仓库提交和登录后的后台），补回被丢的那一层即可。
 */

/** 与 lib/content.ts 里手工遍历 mdast 的思路一致：十来行逻辑不值得再引一个 visit。 */
type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const ALLOWED_PROTOCOLS: Record<string, readonly string[]> = {
  href: ["http", "https", "mailto", "irc", "xmpp"],
  src: ["http", "https"],
};

/**
 * 复刻 hast-util-sanitize 的判断：冒号**在首个 `/`、`?`、`#` 之后**（或根本没有冒号）
 * 就不是协议，直接放行 —— 这样 `./a`、`#x`、`?q=1`、`//cdn/a` 都不会被误杀。
 */
function hasSafeProtocol(value: unknown, allowed: readonly string[]): boolean {
  if (typeof value !== "string") return true;

  const colon = value.indexOf(":");
  const slash = value.indexOf("/");
  const questionMark = value.indexOf("?");
  const numberSign = value.indexOf("#");

  if (
    colon < 0 ||
    (slash > -1 && colon > slash) ||
    (questionMark > -1 && colon > questionMark) ||
    (numberSign > -1 && colon > numberSign)
  ) {
    return true;
  }

  return allowed.includes(value.slice(0, colon).toLowerCase());
}

function walk(node: HastNode, fn: (n: HastNode) => void): void {
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, fn);
  }
}

export default function rehypeSafeUrls() {
  return (tree: HastNode): void => {
    walk(tree, (node) => {
      if (node.type !== "element" || !node.properties) return;
      for (const key of Object.keys(ALLOWED_PROTOCOLS)) {
        if (
          key in node.properties &&
          !hasSafeProtocol(node.properties[key], ALLOWED_PROTOCOLS[key])
        ) {
          delete node.properties[key];
        }
      }
    });
  };
}

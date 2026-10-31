/**
 * 把正文图片包进链接，作为"点击放大"的入口。
 *
 * 没有 JS 时它就是一个普通链接：点开是在新标签页里看原图（渐进增强）。
 * 有 JS 时 components/ImageZoom.tsx 会拦下点击，用灯箱展示。
 *
 * 为什么在 rehype 里做，而不是在客户端给 `<img>` 挂监听：
 *   - 链接是正文 HTML 的一部分，天然可访问：键盘可聚焦、可右键、可新标签打开；
 *   - 不需要客户端遍历 DOM，也不用维护"这个节点处理过没有"的状态。
 *
 * 放在 rehypeSafeUrls 之后：危险的 src 已经被摘掉，不会再包出坏链接。
 */

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

function isImage(node: HastNode): boolean {
  return node.type === "element" && node.tagName === "img";
}

export default function rehypeImageLinks() {
  return (tree: HastNode): void => {
    transform(tree);
  };
}

function transform(node: HastNode): void {
  if (!Array.isArray(node.children)) return;

  node.children = node.children.map((child) => {
    if (isImage(child)) {
      // 已经在链接里的图片（`[![alt](img)](url)`）不能再套一层 a —— 嵌套链接
      // 是非法 HTML，浏览器会把结构拆坏。
      if (node.type === "element" && node.tagName === "a") return child;

      const src = child.properties?.src;
      // 没有 src 的图片没有可放大的目标，原样放过。
      if (typeof src !== "string" || !src) return child;

      return {
        type: "element",
        tagName: "a",
        properties: {
          className: ["prose-image"],
          href: src,
          target: "_blank",
          rel: "noreferrer",
          "data-zoom": "",
        },
        children: [child],
      } satisfies HastNode;
    }

    // 只对"别的节点"递归；刚包好的 a 不再进入，避免无限套娃。
    transform(child);
    return child;
  });
}

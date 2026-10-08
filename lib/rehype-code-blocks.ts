/**
 * 把每个代码块包成"语言栏 + 代码"，并注入复制按钮。
 *
 * **为什么按钮在服务端注入，而不是客户端挂载后 insert：**这样按钮就是正文 HTML 的
 * 一部分，跟着 `dangerouslySetInnerHTML` 一起到达浏览器 —— 不增加任何 RSC payload，
 * 也不需要把正文交给客户端组件去重渲染（`components/CodeCopy.tsx` 因此不需要任何
 * props，更不用把整份字典序列化进浏览器包，见 app/[lang]/layout.tsx 的注释）。
 * 客户端只挂一个委托监听，见 components/CodeCopy.tsx。
 *
 * **按钮是 `<pre>` 的兄弟节点，不在 `<pre>` 里面：**复制读的是 `code.textContent`，
 * 按钮若在 `<pre>` 内，`pre.textContent` 就会混进"复制"两个字。
 *
 * 文案由调用方按语言传入（lib/content.ts 从 lib/i18n.ts 取），这个文件因此零依赖。
 */

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

export type CodeLabels = { copy: string; copied: string; failed: string };

/** `remark` 给带了 info string 的围栏代码块生成 `class="language-xxx"`。 */
const LANGUAGE_PREFIX = "language-";

function languageOf(code: HastNode | undefined): string | null {
  const className = code?.properties?.className;
  if (!Array.isArray(className)) return null;
  for (const name of className) {
    if (typeof name === "string" && name.startsWith(LANGUAGE_PREFIX)) {
      return name.slice(LANGUAGE_PREFIX.length);
    }
  }
  return null;
}

function element(
  tagName: string,
  properties: Record<string, unknown>,
  children: HastNode[],
): HastNode {
  return { type: "element", tagName, properties, children };
}

function copyButton(labels: CodeLabels): HastNode {
  return element(
    "button",
    {
      type: "button",
      className: ["code-copy"],
      "data-code-copy": "",
      "data-copy-label": labels.copy,
      "data-copied-label": labels.copied,
      "data-failed-label": labels.failed,
      // 文案被 JS 换掉时播报一次，否则读屏用户完全感知不到复制成功。
      "aria-live": "polite",
    },
    [{ type: "text", value: labels.copy }],
  );
}

function wrap(pre: HastNode, language: string | null, labels: CodeLabels): HastNode {
  const bar: HastNode[] = [];
  if (language) {
    bar.push(
      element("span", { className: ["code-lang"] }, [
        { type: "text", value: language },
      ]),
    );
  }
  bar.push(copyButton(labels));

  return element(
    "div",
    { className: ["code-block"], "data-code-block": "" },
    [element("div", { className: ["code-block-bar"] }, bar), pre],
  );
}

function transform(node: HastNode, labels: CodeLabels): void {
  if (!Array.isArray(node.children)) return;
  node.children = node.children.map((child) => {
    if (child.type === "element" && child.tagName === "pre") {
      const code = child.children?.find(
        (c) => c.type === "element" && c.tagName === "code",
      );
      // 找不到 <code> 就不是标准代码块（理论上是够不到的），原样放过而不是硬包。
      if (code) return wrap(child, languageOf(code), labels);
    }
    transform(child, labels);
    return child;
  });
}

export default function rehypeCodeBlocks(options: { labels: CodeLabels }) {
  const { labels } = options;
  return (tree: HastNode): void => {
    transform(tree, labels);
  };
}

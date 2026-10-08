/**
 * 行内代码（`` `MIN(++a, b)` `` 这种）的语法着色。
 *
 * **为什么要单独写一个插件：** `rehype-highlight` 只认 `<pre>` 里的 `<code>`
 * （源码里就写着 `parent.tagName !== 'pre'` 直接返回），行内的它一概不管。
 *
 * **语言从哪来：** 围栏代码块自带 `class="language-c"`，行内代码什么都没有 ——
 * 它在 markdown 里就只有一对反引号。自动识别是不可用的：实测
 * `MIN(++a, b)` 会被认成 css、`typeof()` 认成 scss、`_a < _b ? _a : _b;` 认成 css，
 * relevance 只有 1–4。猜错颜色比不着色更糟。
 *
 * 所以规则是**沿用同一篇文档里代码块的语言**，按文档顺序取"前面最近的那个"，
 * 前面还没有代码块就用文档里第一个有语言的块：
 *
 *   ```c            →  此后行内代码都按 C 高亮
 *   `typeof()`      →  着成 C 关键字
 *
 * 好处是零配置：一篇 Python 文章的行内代码自动是 Python，没人需要声明任何东西。
 * 代价是混合语言的文档里，行内代码跟的是"最近的上下文"而不是它自己的语言 ——
 * 对单人博客这种"一篇一个主题"的写法足够了。
 *
 * 整篇没有带语言的代码块时（比如只有一句 `` `code` `` 的随笔），这里什么都不做：
 * 无从推断就不猜，宁可不着色。
 */

import { common, createLowlight } from "lowlight";

/** 与 rehype-highlight 用的是同一份 common 集，因此不额外增加打包体积。 */
const lowlight = createLowlight(common);

type HastNode = {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
  value?: string;
};

const LANGUAGE_PREFIX = "language-";

function languageOf(node: HastNode): string | null {
  const className = node.properties?.className;
  if (!Array.isArray(className)) return null;
  for (const name of className) {
    if (typeof name === "string" && name.startsWith(LANGUAGE_PREFIX)) {
      return name.slice(LANGUAGE_PREFIX.length);
    }
  }
  return null;
}

function isBlockCode(node: HastNode, parent: HastNode | null): boolean {
  return (
    node.type === "element" &&
    node.tagName === "code" &&
    parent?.type === "element" &&
    parent.tagName === "pre"
  );
}

function isInlineCode(node: HastNode, parent: HastNode | null): boolean {
  return (
    node.type === "element" && node.tagName === "code" && !isBlockCode(node, parent)
  );
}

/** 行内代码的内容一定是纯文本，但代码块里可能有嵌套的 span，所以递归取。 */
function textOf(node: HastNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(textOf).join("");
}

function walk(
  node: HastNode,
  visit: (n: HastNode, parent: HastNode | null) => void,
  parent: HastNode | null = null,
): void {
  visit(node, parent);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, visit, node);
  }
}

/** 文档里第一个带语言的代码块，作为"行内代码出现在任何代码块之前"时的兜底。 */
function firstBlockLanguage(tree: HastNode): string | null {
  let found: string | null = null;
  walk(tree, (node, parent) => {
    if (found || !isBlockCode(node, parent)) return;
    found = languageOf(node);
  });
  return found;
}

export default function rehypeInlineCode() {
  return (tree: HastNode): void => {
    const fallback = firstBlockLanguage(tree);

    // 按文档顺序走一遍：路过代码块就更新"当前语言"，遇到行内代码就用它上色。
    let current: string | null = null;
    walk(tree, (node, parent) => {
      if (isBlockCode(node, parent)) {
        // 代码块没写语言时保留上一个，而不是把上下文重置掉。
        current = languageOf(node) ?? current;
        return;
      }
      if (!isInlineCode(node, parent)) return;

      const language = current ?? fallback;
      if (!language || !lowlight.registered(language)) return;

      const text = textOf(node);
      if (!text.trim()) return;

      try {
        node.children = lowlight.highlight(language, text).children as HastNode[];
      } catch {
        // 高亮失败就保持纯文本：正文渲染绝不能因为一段行内代码而整页 500。
      }
    });
  };
}

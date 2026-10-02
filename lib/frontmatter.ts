/**
 * frontmatter 的序列化、解析与校验。
 *
 * **这个模块必须保持零 Node 依赖** —— 服务端（lib/content.ts）和浏览器端
 * （admin 的编辑器）都要用它。写在这里的规则就是"什么算一篇合法文章"的
 * 唯一定义，两边不能各写一份，否则迟早漂移。
 */

export type FrontmatterData = Record<string, unknown>;

/**
 * 序列化。**必须走 JSON.stringify，不能手写引号拼接。**
 *
 * JSON 字符串是合法的 YAML 标量（YAML 1.2 是 JSON 的超集），所以
 * JSON.stringify 产出的带转义引号的字符串能被 gray-matter 正确解析。
 * 手写 `"${title}"` 在标题含引号、冒号或换行时会产出畸形 YAML —— 后果不是
 * 这一篇读不出来，而是下一次部署时 `npm run build` 在 generateStaticParams
 * 里抛错、整个部署失败，而那时没人会联想到是几天前发的那篇文章。
 *
 * 非 ASCII 字符不会被转义（JSON.stringify("你好") === '"你好"'），
 * 所以中文标题在文件里保持可读。
 */
export function serializeFrontmatter(
  data: FrontmatterData,
  body: string,
): string {
  const lines = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join("\n")}\n---\n\n${body.trim()}\n`;
}

/**
 * 极简的 frontmatter 拆分。
 *
 * 刻意不引 gray-matter —— 那个依赖 js-yaml，是服务端的东西。这里只需要处理
 * **我们自己写出去**的格式（值一定是 JSON.stringify 的产物），所以一个正则
 * 加 JSON.parse 就够。遇到手写的旧文件（比如 `lang: zh` 这种裸字符串）会
 * 退化成原样字符串，不会解析失败。
 */
export function splitFrontmatter(raw: string): {
  data: FrontmatterData;
  content: string;
} {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!m) return { data: {}, content: raw };

  const data: FrontmatterData = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    let value: unknown = kv[2];
    try {
      value = JSON.parse(kv[2]);
    } catch {
      /* 不是 JSON 就当裸字符串 */
    }
    data[kv[1]] = value;
  }
  return { data, content: raw.slice(m[0].length) };
}

/**
 * 类型校验，写入前的最后一道闸。
 *
 * 光靠"能否被 YAML 解析"是不够的：JSON.stringify 保证产出的一定是合法
 * YAML，但它不保证**形状**对。比如 tags 传进来一个对象，序列化出的
 * `tags: {"a":1}` 是合法 YAML，能通过解析，但读回来 tags 不是数组，
 * 列表页 `.map()` 直接抛错 —— 而且是在下一次部署构建时才炸。
 *
 * 日期格式也在这里卡死：getItems 用字符串比较排序，混入时间会让排序
 * 结果不符合直觉。
 */
export function assertValidFrontmatter(data: FrontmatterData): void {
  const problems: string[] = [];

  if (typeof data.title !== "string" || !data.title.trim()) {
    problems.push("title 必须是非空字符串");
  }
  if (typeof data.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    problems.push("date 必须是 YYYY-MM-DD 格式的字符串");
  }
  if (data.summary !== undefined && typeof data.summary !== "string") {
    problems.push("summary 必须是字符串");
  }
  if (data.tags !== undefined) {
    if (
      !Array.isArray(data.tags) ||
      data.tags.some((t) => typeof t !== "string")
    ) {
      problems.push("tags 必须是字符串数组");
    }
  }
  if (typeof data.lang !== "string") {
    problems.push("lang 必须是字符串");
  }

  if (problems.length > 0) {
    throw new Error(`frontmatter 不合法：${problems.join("；")}`);
  }
}

/** 去掉 markdown 记号，用于从正文自动生成 moments 的标题与摘要。 */
export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-[\]()!]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

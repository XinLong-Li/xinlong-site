import { createHash } from "node:crypto";

/**
 * slug 生成。文件名即 slug（见 lib/content.ts 的 getSlugs），所以这里产出的
 * 字符串是**对外 URL 的一部分**，一旦发布就不能再变。
 *
 * 日期统一为 YYYY-MM-DD：getItems 用字符串比较排序
 * （lib/content.ts 的 `(a, b) => (a.date > b.date ? -1 : 1)`），
 * 混入时间会让排序结果不符合直觉。
 */
export function todayStamp(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function slugify(title: string, date: string): string {
  // 抽取标题里的拉丁字母与数字。中英混排时保留英文部分：
  // "用 ROS2 做轨迹规划" → "ros2"
  const latin = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "") // 去掉 NFKD 拆出来的组合变音符
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (latin) return `${date}-${latin.slice(0, 60)}`;

  // 全中文标题走到这里：上面那步会得到空串，若不处理，多篇中文文章会
  // 全部落到同一个 slug 上互相覆盖。
  //
  // 用**内容哈希**而非随机数或序号：同一标题重复提交得到同一个 slug，
  // "提交失败后重试"的场景下不会产生重复文件。序号方案则要求先扫描
  // 现有文件求最大值，而"删掉中间一篇再新建"必然撞号。
  const hash = createHash("sha256").update(title).digest("hex").slice(0, 8);
  return `${date}-zh-${hash}`;
}

/**
 * 冲突时加 -2、-3 后缀。
 *
 * `exclude` 是编辑路径专用的：编辑时若把当前文件自己也当成"已占用"，
 * 重算出同名 slug 会被误判为冲突，把自己的文件改名成 -2，URL 无端变化。
 */
export function uniqueSlug(
  taken: Iterable<string>,
  base: string,
  exclude?: string,
): string {
  const used = new Set(taken);
  if (exclude) used.delete(exclude);

  if (!used.has(base)) return base;

  let n = 2;
  while (used.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

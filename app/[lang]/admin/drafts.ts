/**
 * 后台编辑器的本地草稿（localStorage）。
 *
 * 存在的理由：编辑状态全在 AdminPanel 的 React state 里，点一下导航（next/link）
 * 或切语言（router.push）整个页面就被卸载，正在写的正文直接消失。这里每 500ms
 * 落一次盘，回到 /admin 时再自动恢复。
 *
 * **只存用户自己写的内容**（标题 / 标签 / 正文），绝不存 token 或 RepoRef ——
 * 与 lib/github-client.ts、app/[lang]/admin/actions.ts 里那条约束一致：长期凭证
 * 不落持久存储。这个模块的入参类型里根本没有放凭证的位置。
 *
 * 浏览器不让用 localStorage 时（部分无痕模式、被禁用、配额满），每个函数都静默
 * 退化成"没有草稿"，绝不能让后台因为存不了草稿而报错。
 */

import { isSafeSlug } from "@/lib/slug";
import type { Lang } from "@/lib/i18n";
import type { EditorValues } from "./Editor";

export type Kind = "post" | "moment";

/** 草稿目标：某篇已有文章，或那个新建输入框。 */
export type DraftTarget =
  | { scope: "new" }
  | { scope: "edit"; kind: Kind; slug: string };

export type Draft = EditorValues & { updatedAt: number };

const PREFIX = "xinlong:admin:drafts:v1";
/** 超过这个时间的草稿视为垃圾，避免为早已放弃的文章永久保留副本。 */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_DRAFTS = 20;

type Entry = {
  kind: Kind;
  title: string;
  tags: string;
  body: string;
  updatedAt: number;
};
type Drafts = Record<string, Entry>;

/** 语言进存储键：/zh/admin 和 /en/admin 的草稿互不串门。 */
function storageKey(lang: Lang): string {
  return `${PREFIX}:${lang}`;
}

export function keyFor(target: DraftTarget): string {
  return target.scope === "new" ? "new" : `edit:${target.kind}:${target.slug}`;
}

function targetForKey(key: string): DraftTarget | null {
  if (key === "new") return { scope: "new" };
  const m = /^edit:(post|moment):(.+)$/.exec(key);
  if (!m || !isSafeSlug(m[2])) return null;
  return { scope: "edit", kind: m[1] as Kind, slug: m[2] };
}

/** 空草稿没有保存的意义；moment 没有标题/标签两个字段，判断要分类型。 */
export function isEmpty(values: EditorValues): boolean {
  if (values.body.trim()) return false;
  if (values.kind === "moment") return true;
  return !values.title.trim() && !values.tags.trim();
}

/** 逐条校验：localStorage 可以被手改，坏数据只能被丢掉，不能抛。 */
function parseEntry(key: string, raw: unknown): Entry | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  if (e.kind !== "post" && e.kind !== "moment") return null;
  if (
    typeof e.title !== "string" ||
    typeof e.tags !== "string" ||
    typeof e.body !== "string" ||
    typeof e.updatedAt !== "number" ||
    !Number.isFinite(e.updatedAt)
  ) {
    return null;
  }
  if (key !== "new") {
    const m = /^edit:(post|moment):(.+)$/.exec(key);
    if (!m || m[1] !== e.kind || !isSafeSlug(m[2])) return null;
  }
  return {
    kind: e.kind,
    title: e.title,
    tags: e.tags,
    body: e.body,
    updatedAt: e.updatedAt,
  };
}

function read(lang: Lang): Drafts {
  try {
    const raw = localStorage.getItem(storageKey(lang));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const envelope = parsed as Record<string, unknown>;
    if (envelope.v !== 1 || !envelope.drafts || typeof envelope.drafts !== "object") {
      return {};
    }
    const out: Drafts = {};
    for (const [key, value] of Object.entries(
      envelope.drafts as Record<string, unknown>,
    )) {
      const entry = parseEntry(key, value);
      if (entry) out[key] = entry;
    }
    return out;
  } catch {
    return {};
  }
}

function prune(drafts: Drafts): { drafts: Drafts; changed: boolean } {
  const now = Date.now();
  let changed = false;
  let entries = Object.entries(drafts).filter(([, d]) => {
    const keep = now - d.updatedAt <= MAX_AGE_MS;
    if (!keep) changed = true;
    return keep;
  });
  if (entries.length > MAX_DRAFTS) {
    // 按时间升序保留最新的 MAX_DRAFTS 条：写回后对象的插入顺序就是
    // 旧 → 新，latestDraft 在时间戳相同的时候才能稳定地选中最后一条。
    entries = entries
      .sort((a, b) => a[1].updatedAt - b[1].updatedAt)
      .slice(-MAX_DRAFTS);
    changed = true;
  }
  return { drafts: Object.fromEntries(entries), changed };
}

function write(lang: Lang, drafts: Drafts): boolean {
  try {
    localStorage.setItem(storageKey(lang), JSON.stringify({ v: 1, drafts }));
    return true;
  } catch {
    // 配额满：丢掉较旧的一半再试一次。还失败就放弃 —— 存草稿不值得打断编辑。
    try {
      const entries = Object.entries(drafts).sort(
        (a, b) => b[1].updatedAt - a[1].updatedAt,
      );
      const trimmed = Object.fromEntries(
        entries.slice(0, Math.max(1, Math.floor(entries.length / 2))),
      );
      localStorage.setItem(storageKey(lang), JSON.stringify({ v: 1, drafts: trimmed }));
      return true;
    } catch {
      return false;
    }
  }
}

/** 读出并顺手做一次清理（过期、超量）。清理结果写回，失败也无所谓。 */
export function readDrafts(lang: Lang): Map<string, Draft> {
  const { drafts, changed } = prune(read(lang));
  if (changed) write(lang, drafts);
  const map = new Map<string, Draft>();
  for (const [key, entry] of Object.entries(drafts)) {
    map.set(key, {
      kind: entry.kind,
      title: entry.title,
      tags: entry.tags,
      body: entry.body,
      updatedAt: entry.updatedAt,
    });
  }
  return map;
}

export function getDraft(lang: Lang, target: DraftTarget): Draft | null {
  return readDrafts(lang).get(keyFor(target)) ?? null;
}

/** 空内容 = 删除该条草稿。返回是否写成功（失败时调用方可以继续编辑）。 */
export function saveDraft(
  lang: Lang,
  target: DraftTarget,
  values: EditorValues,
): boolean {
  const key = keyFor(target);
  const drafts = read(lang);

  if (isEmpty(values)) {
    if (!(key in drafts)) return true;
    delete drafts[key];
  } else {
    // 覆盖已有 key 不会改变它在对象里的位置。先删再插，让"最近保存的"
    // 始终排在最后 —— latestDraft 在时间戳撞车时靠这个顺序兜底。
    delete drafts[key];
    drafts[key] = {
      kind: values.kind,
      title: values.title,
      tags: values.tags,
      body: values.body,
      updatedAt: Date.now(),
    };
  }

  return write(lang, prune(drafts).drafts);
}

export function dropDraft(lang: Lang, target: DraftTarget): void {
  const drafts = read(lang);
  const key = keyFor(target);
  if (key in drafts) {
    delete drafts[key];
    write(lang, drafts);
  }
}

/** 最近更新的一条草稿 —— 回到 /admin 时恢复它。 */
export function latestDraft(
  lang: Lang,
): { key: string; target: DraftTarget; draft: Draft } | null {
  let best: { key: string; target: DraftTarget; draft: Draft } | null = null;
  for (const [key, draft] of readDrafts(lang)) {
    const target = targetForKey(key);
    if (!target) continue;
    // 用 >= 而不是 >：同一毫秒内保存的两条草稿，后写入的胜出（saveDraft
    // 保证最近保存的那条排在对象最后）。
    if (!best || draft.updatedAt >= best.draft.updatedAt) {
      best = { key, target, draft };
    }
  }
  return best;
}

"use client";

import { useState } from "react";

import type { Lang } from "@/lib/i18n";
import { deleteMomentAction, deletePostAction } from "./actions";

export type RuntimeEntry = {
  kind: "post" | "moment";
  slug: string;
  title: string;
  date: string;
};

/**
 * 本站发布的内容：可编辑、可删除。
 *
 * 删除用两段式确认（先点"删除"变成"确认删除"），而不是 <button onClick>：
 * 后者绕过表单语义，键盘用户无法触发。两段式同时比 confirm() 弹窗更轻，
 * 且不阻塞主线程。
 */
export default function RuntimeList({
  lang,
  entries,
  labels,
}: {
  lang: Lang;
  entries: RuntimeEntry[];
  labels: { edit: string; remove: string; confirmRemove: string; kindPost: string; kindMoment: string };
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <ul className="flex flex-col gap-2">
      {entries.map((e) => {
        const key = `${e.kind}:${e.slug}`;
        const isConfirming = confirming === key;
        return (
          <li
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3"
          >
            <span className="shrink-0 rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-fg-subtle">
              {e.kind === "post" ? labels.kindPost : labels.kindMoment}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{e.title}</p>
              <p className="font-mono text-xs text-fg-subtle">{e.date}</p>
            </div>

            <a
              href={`/${lang}/admin?edit=${encodeURIComponent(e.slug)}&kind=${e.kind}`}
              className="shrink-0 text-xs font-medium text-accent transition-colors hover:text-accent-strong"
            >
              {labels.edit}
            </a>

            {/* 用 <form> 而不是裸的 onClick：这样键盘用户也能触发。 */}
            <form
              action={e.kind === "post" ? deletePostAction : deleteMomentAction}
              onSubmit={() => setConfirming(null)}
            >
              <input type="hidden" name="lang" value={lang} />
              <input type="hidden" name="kind" value={e.kind} />
              <input type="hidden" name="slug" value={e.slug} />
              {isConfirming ? (
                <button
                  type="submit"
                  autoFocus
                  onBlur={() => setConfirming(null)}
                  className="shrink-0 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700"
                >
                  {labels.confirmRemove}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirming(key)}
                  className="shrink-0 text-xs font-medium text-fg-subtle transition-colors hover:text-red-600 dark:hover:text-red-400"
                >
                  {labels.remove}
                </button>
              )}
            </form>
          </li>
        );
      })}
    </ul>
  );
}

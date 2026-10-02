"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import type { MergedPost, PostState } from "./AdminPanel";

type Labels = {
  edit: string;
  remove: string;
  confirmRemove: string;
  kindPost: string;
  kindMoment: string;
  stateLive: string;
  statePending: string;
  stateDraft: string;
  statePendingDelete: string;
};

const stateStyle: Record<PostState, string> = {
  live: "bg-surface-sunken text-fg-subtle",
  pending: "bg-accent-soft/60 text-accent",
  draft: "bg-surface-sunken text-fg-muted ring-1 ring-border",
  pendingDelete: "bg-surface-sunken text-fg-subtle line-through",
};

export default function PostList({
  posts,
  labels,
  busy,
  onEdit,
  onDelete,
}: {
  posts: MergedPost[];
  labels: Labels;
  busy: boolean;
  onEdit: (post: MergedPost) => void | Promise<void>;
  onDelete: (post: MergedPost) => void | Promise<void>;
}) {
  const [confirming, setConfirming] = useState<string | null>(null);

  const stateLabel: Record<PostState, string> = {
    live: labels.stateLive,
    pending: labels.statePending,
    draft: labels.stateDraft,
    pendingDelete: labels.statePendingDelete,
  };

  return (
    <ul className="flex flex-col gap-2">
      {posts.map((p) => {
        const key = `${p.kind}:${p.slug}`;
        const isConfirming = confirming === key;
        // 只在服务器上的遗留草稿没有 git sha，删不了 —— 得先保存一次把它
        // 提交进仓库。工具栏照常显示，点了会给明确提示而不是静默失败。
        const canEdit = p.state !== "pendingDelete";

        return (
          <li
            key={key}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3"
          >
            <span className="shrink-0 rounded-md bg-surface-sunken px-2 py-0.5 text-[11px] font-medium text-fg-subtle">
              {p.kind === "post" ? labels.kindPost : labels.kindMoment}
            </span>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{p.title}</p>
              <p className="font-mono text-xs text-fg-subtle">{p.date || p.slug}</p>
            </div>

            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                stateStyle[p.state],
              )}
            >
              {stateLabel[p.state]}
            </span>

            {canEdit && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onEdit(p)}
                className="shrink-0 text-xs font-medium text-accent transition-colors hover:text-accent-strong disabled:opacity-50"
              >
                {labels.edit}
              </button>
            )}

            {/* 用 <form> 而不是裸的 onClick：这样键盘用户也能触发。
                两段式确认比 confirm() 弹窗轻，且不阻塞主线程。 */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirming(null);
                void onDelete(p);
              }}
            >
              {isConfirming ? (
                <button
                  type="submit"
                  disabled={busy}
                  autoFocus
                  onBlur={() => setConfirming(null)}
                  className="shrink-0 rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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

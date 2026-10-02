"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/i18n";

type Kind = "post" | "moment";

export type EditorValues = {
  kind: Kind;
  title: string;
  tags: string;
  body: string;
};

type Labels = {
  kindPost: string;
  kindMoment: string;
  fieldTitle: string;
  fieldTags: string;
  fieldBody: string;
  fieldBodyMoment: string;
  publish: string;
  save: string;
  cancel: string;
  tagsHint: string;
};

const field =
  "mt-2 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-fg outline-none transition-colors focus:border-accent disabled:opacity-60";
const labelCls = "block text-sm font-medium text-fg-muted";

export default function Editor({
  lang,
  labels,
  initial,
  disabled,
  onSubmit,
  onCancel,
}: {
  lang: Lang;
  labels: Labels;
  initial?: EditorValues & { slug: string };
  disabled: boolean;
  onSubmit: (values: EditorValues) => void | Promise<void>;
  onCancel: () => void;
}) {
  const isEdit = Boolean(initial);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "post");

  // 非受控字段：切换类型 / 切到另一篇编辑时用 key 重建，避免残留上一次的内容。
  const formKey = `${isEdit ? initial!.slug : "new"}-${kind}`;

  return (
    <form
      key={formKey}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        void onSubmit({
          kind,
          title: String(fd.get("title") ?? ""),
          tags: String(fd.get("tags") ?? ""),
          body: String(fd.get("body") ?? ""),
        });
      }}
      className="rounded-xl border border-border bg-surface-raised p-5 shadow-[var(--shadow-card)]"
    >
      {/* 编辑态不允许改类型：两个集合的目录不同，改类型等于换 URL。 */}
      {!isEdit && (
        <div className="mb-5 inline-flex rounded-xl border border-border p-0.5">
          {(["post", "moment"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={cn(
                "rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors",
                kind === k
                  ? "bg-accent text-white dark:text-surface"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {k === "post" ? labels.kindPost : labels.kindMoment}
            </button>
          ))}
        </div>
      )}

      {kind === "post" && (
        <>
          <label className={labelCls} htmlFor="f-title">
            {labels.fieldTitle}
          </label>
          <input
            id="f-title"
            name="title"
            required
            disabled={disabled}
            defaultValue={initial?.title ?? ""}
            className={field}
          />

          <label className={cn(labelCls, "mt-4")} htmlFor="f-tags">
            {labels.fieldTags}
          </label>
          <input
            id="f-tags"
            name="tags"
            disabled={disabled}
            defaultValue={initial?.tags ?? ""}
            placeholder={labels.tagsHint}
            className={field}
          />
        </>
      )}

      <label className={cn(labelCls, "mt-4")} htmlFor="f-body">
        {kind === "post" ? labels.fieldBody : labels.fieldBodyMoment}
      </label>
      <textarea
        id="f-body"
        name="body"
        required
        disabled={disabled}
        rows={kind === "post" ? 14 : 5}
        defaultValue={initial?.body ?? ""}
        className={cn(field, "resize-y font-mono text-sm leading-relaxed")}
      />

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60 dark:text-surface"
        >
          {isEdit ? labels.save : labels.publish}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {labels.cancel}
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-fg-subtle">
        {/* 提交会直接写进 GitHub 仓库，不是写服务器磁盘 —— 说清楚，
            否则用户会以为保存了什么都没发生。 */}
        {lang === "zh"
          ? "保存 = 提交到 GitHub 仓库，约 1–2 分钟后自动部署上线。"
          : "Saving commits to the GitHub repository directly — live in about 1–2 minutes."}
      </p>
    </form>
  );
}

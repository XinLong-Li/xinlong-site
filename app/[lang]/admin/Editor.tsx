"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/i18n";
import {
  createMomentAction,
  createPostAction,
  updateMomentAction,
  updatePostAction,
} from "./actions";

type Kind = "post" | "moment";

export type EditorInitial = {
  kind: Kind;
  slug: string;
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

/**
 * 提交按钮必须用原生 <button type="submit">。
 * components/Button.tsx 硬编码了 type="button"，放进表单里点了不提交，
 * 而且看起来像"按钮没反应"。
 */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60 dark:text-surface"
    >
      {pending ? "…" : label}
    </button>
  );
}

const field =
  "mt-2 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-fg outline-none transition-colors focus:border-accent";
const labelCls = "block text-sm font-medium text-fg-muted";

export default function Editor({
  lang,
  labels,
  initial,
}: {
  lang: Lang;
  labels: Labels;
  initial?: EditorInitial;
}) {
  const isEdit = Boolean(initial);
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "post");

  const action = isEdit
    ? kind === "post"
      ? updatePostAction
      : updateMomentAction
    : kind === "post"
      ? createPostAction
      : createMomentAction;

  return (
    <form
      // key 让切换类型时重建表单：从长文切到随笔要丢掉标题和标签，
      // 否则会出现"看起来填了但不会被保存"的困惑。
      key={`${isEdit ? "edit" : "new"}-${kind}`}
      action={action}
      className="rounded-xl border border-border bg-surface-raised p-5 shadow-[var(--shadow-card)]"
    >
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="kind" value={kind} />
      {isEdit && <input type="hidden" name="slug" value={initial!.slug} />}

      {/* 编辑态不允许改类型：两个集合的 slug 语义不同，改类型等于换 URL。 */}
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
            defaultValue={initial?.title ?? ""}
            className={field}
          />

          <label className={cn(labelCls, "mt-4")} htmlFor="f-tags">
            {labels.fieldTags}
          </label>
          <input
            id="f-tags"
            name="tags"
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
        rows={kind === "post" ? 14 : 5}
        defaultValue={initial?.body ?? ""}
        className={cn(field, "resize-y font-mono text-sm leading-relaxed")}
      />

      <div className="mt-5 flex items-center gap-3">
        <SubmitButton label={isEdit ? labels.save : labels.publish} />
        {isEdit && (
          <a
            href={`/${lang}/admin`}
            className="text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            {labels.cancel}
          </a>
        )}
      </div>
    </form>
  );
}

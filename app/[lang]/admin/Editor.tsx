"use client";

import { useRef, useState } from "react";

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

/** 从表单读一次当前值。onInput 与 onSubmit 共用，避免两处解析逻辑漂移。 */
function readValues(form: HTMLFormElement, kind: Kind): EditorValues {
  const fd = new FormData(form);
  return {
    kind,
    title: String(fd.get("title") ?? ""),
    tags: String(fd.get("tags") ?? ""),
    body: String(fd.get("body") ?? ""),
  };
}

export default function Editor({
  lang,
  labels,
  initial,
  defaults,
  disabled,
  onSubmit,
  onCancel,
  onDraftChange,
}: {
  lang: Lang;
  labels: Labels;
  initial?: EditorValues & { slug: string };
  /** 新建输入框的初始内容（从本地草稿恢复时用）。 */
  defaults?: EditorValues;
  disabled: boolean;
  onSubmit: (values: EditorValues) => void | Promise<void>;
  onCancel: () => void;
  onDraftChange: (values: EditorValues) => void;
}) {
  const isEdit = Boolean(initial);
  // 字段是非受控的；AdminPanel 用 <Editor key> 按目标重建整个组件，所以 kind 只在
  // 挂载时取一次初值即可。
  const [composerKind, setComposerKind] = useState<Kind>(
    defaults?.kind ?? "post",
  );
  // 编辑已有文章时 kind 必须来自 initial —— 它决定写进 posts/ 还是 moments/。
  // 以前这里是一个只初始化一次的 state：编辑随笔时它可能还停在 "post"，
  // 保存就会把文件写进错误的目录。派生自 initial 之后不会漂。
  const kind: Kind = isEdit ? initial!.kind : composerKind;
  const formRef = useRef<HTMLFormElement>(null);
  const seed = initial ?? defaults;

  /**
   * 切换长文/随笔。点击按钮不触发 input 事件，所以要主动上报一次草稿；
   * 切到随笔时标题/标签会卸载，草稿里也一并清空，保持 UI 与草稿一致。
   */
  function chooseKind(next: Kind) {
    if (next === kind) return;
    const current = formRef.current
      ? readValues(formRef.current, kind)
      : { kind, title: "", tags: "", body: "" };
    setComposerKind(next);
    onDraftChange({
      ...current,
      kind: next,
      title: next === "post" ? current.title : "",
      tags: next === "post" ? current.tags : "",
    });
  }

  return (
    <form
      ref={formRef}
      onInput={() => {
        if (formRef.current) onDraftChange(readValues(formRef.current, kind));
      }}
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(readValues(e.currentTarget, kind));
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
              onClick={() => chooseKind(k)}
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
            readOnly={disabled}
            defaultValue={seed?.title ?? ""}
            className={field}
          />

          <label className={cn(labelCls, "mt-4")} htmlFor="f-tags">
            {labels.fieldTags}
          </label>
          <input
            id="f-tags"
            name="tags"
            readOnly={disabled}
            defaultValue={seed?.tags ?? ""}
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
        readOnly={disabled}
        rows={kind === "post" ? 14 : 5}
        defaultValue={seed?.body ?? ""}
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

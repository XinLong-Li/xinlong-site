"use client";

import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";
import type { Lang } from "@/lib/i18n";

/**
 * 提交按钮必须用原生 <button type="submit">，不能用 components/Button.tsx
 * ——那个组件硬编码了 type="button"（components/Button.tsx:58），放进表单里
 * 点了不会提交，而且看起来像"按钮没反应"，很难定位。
 */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-60 dark:text-surface"
    >
      {pending ? "…" : label}
    </button>
  );
}

export default function LoginForm({
  lang,
  labels,
  error,
}: {
  lang: Lang;
  labels: { password: string; signIn: string; wrongPassword: string; lockedOut: string };
  error?: string;
}) {
  const message =
    error === "locked"
      ? labels.lockedOut
      : error === "bad"
        ? labels.wrongPassword
        : null;

  return (
    <form action={loginAction} className="mx-auto mt-16 max-w-sm">
      <input type="hidden" name="lang" value={lang} />

      <label
        htmlFor="admin-password"
        className="block text-sm font-medium text-fg-muted"
      >
        {labels.password}
      </label>
      <input
        id="admin-password"
        name="password"
        type="password"
        required
        autoFocus
        autoComplete="current-password"
        className="mt-2 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-fg outline-none transition-colors focus:border-accent"
      />

      {message && (
        // role="alert" 让屏幕阅读器读到它；这里不用 aria-live，
        // 因为整页会因重定向重新加载，alert 已足够。
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {message}
        </p>
      )}

      <div className="mt-5">
        <SubmitButton label={labels.signIn} />
      </div>
    </form>
  );
}

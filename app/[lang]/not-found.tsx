import Link from "next/link";

/**
 * 已知语言下的 404（例如错误的文章 slug）。它在正常布局树里渲染，
 * 因此带着导航与页脚，体验远好于全局 404。
 *
 * not-found.tsx 不接受 params，所以这里同时给出中英两种文案。
 */
export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-fg sm:text-3xl">
        页面不存在 · Page not found
      </h1>
      <p className="mx-auto mt-4 max-w-md leading-relaxed text-fg-muted">
        你要找的内容可能已被移动或删除。
        <br />
        The page you are looking for may have been moved or removed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-medium">
        <Link
          href="/zh"
          className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-fg transition-colors hover:border-border-strong"
        >
          返回首页
        </Link>
        <Link
          href="/en"
          className="rounded-xl border border-border bg-surface-raised px-4 py-2 text-fg transition-colors hover:border-border-strong"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}

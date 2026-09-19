import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const base = cn(
  "block rounded-xl border border-border bg-surface-raised p-5",
  "shadow-[var(--shadow-card)]",
  "transition-[box-shadow,transform,border-color] duration-200",
);

/**
 * 传 href 时整张卡片可点（hover 目标是整块surface，而不是一行文字），
 * 否则渲染为普通容器。
 */
export default function Card({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "group",
          "hover:-translate-y-0.5 hover:border-border-strong",
          "hover:shadow-[var(--shadow-card-hover)]",
          className,
        )}
      >
        {children}
      </Link>
    );
  }

  return <div className={cn(base, className)}>{children}</div>;
}

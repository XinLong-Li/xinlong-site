import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * 取代首页/列表页里四处重复的
 * `display:flex; justifyContent:space-between` 内联块。
 */
export default function SectionHeader({
  title,
  actionHref,
  actionLabel,
  className,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <h2 className="text-2xl font-semibold tracking-tight text-fg">
        {title}
      </h2>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {actionLabel} →
        </Link>
      )}
    </div>
  );
}

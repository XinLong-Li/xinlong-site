import { cn } from "@/lib/cn";

/**
 * 取代散落的 `.skill-tag`、`.project-tags span`。
 * 用 flex-wrap 排布，长中文串不再需要旧实现的 word-break hack。
 */
export default function Tag({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-border",
        "bg-surface-sunken px-2.5 py-1 text-xs font-medium text-fg-muted",
        className,
      )}
    >
      {children}
    </span>
  );
}

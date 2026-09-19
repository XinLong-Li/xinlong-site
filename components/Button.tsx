import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: cn(
    "bg-accent text-white hover:bg-accent-strong",
    "dark:text-surface",
  ),
  secondary: cn(
    "border border-border bg-surface-raised text-fg",
    "hover:border-border-strong hover:bg-surface-sunken",
  ),
  ghost: cn("text-accent hover:text-accent-strong"),
};

const base = cn(
  "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2",
  "text-sm font-semibold transition-colors",
);

/**
 * 传 href 时渲染为 <Link>，否则为 <button>。
 * 取代 .btn / .social-link / .section-link，以及旧代码里引用了一个
 * 从未定义过的 .button 类的两个组件。
 */
export default function Button({
  children,
  href,
  variant = "secondary",
  className,
  external,
  ...rest
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  external?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">) {
  const classes = cn(base, variants[variant], className);

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

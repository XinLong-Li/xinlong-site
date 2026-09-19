import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export default function PageHeader({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <header className={cn("mb-10", className)}>
      <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 max-w-2xl leading-relaxed text-fg-muted">
          {subtitle}
        </p>
      )}
      {children}
    </header>
  );
}

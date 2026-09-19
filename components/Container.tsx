import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 全站唯一的横向尺度。此前 `.container`（padding 16px）与
 * `.navbar-container`（padding 20px）不一致，导致导航与页面对不齐。
 */
export default function Container({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return (
    <As className={cn("mx-auto w-full max-w-5xl px-5", className)}>
      {children}
    </As>
  );
}

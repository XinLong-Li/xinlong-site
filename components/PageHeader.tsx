import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * 页面头部。
 *
 * 导航已经写明了当前栏目，这里再放一个大号"博客/项目/简历"会重复一次，
 * 而且把正文压到首屏以下。改成**小号 section 标签 + 副标题**的层级：
 *
 *   博客                                   ← 12px、字距拉开，像面包屑
 *   技术、瞬间与点子，按时间排列            ← 真正的主行
 *
 * H1 仍然保留（SEO 和无障碍需要页面主标题），只是视觉上退到标签的位置。
 * 六个页面共用这个组件，中英文自动一致。
 */
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
    <header className={cn("mb-8", className)}>
      <h1 className="text-xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-fg-muted sm:text-lg">
          {subtitle}
        </p>
      )}
      {children}
    </header>
  );
}

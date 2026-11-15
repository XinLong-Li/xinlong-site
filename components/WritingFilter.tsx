"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type WritingKind = "all" | "post" | "moment" | "idea";

type Labels = Record<WritingKind, string>;
type Counts = Record<WritingKind, number>;

const ORDER: WritingKind[] = ["all", "post", "moment", "idea"];

/**
 * 统一博客流的筛选条。
 *
 * **只负责状态和一根 data-filter 属性，内容本身是服务端渲染好传进来的
 * children。** 这样文章/瞬间/点子的排版（包括 Prose 的完整渲染）都留在
 * 服务端，客户端只切换 CSS（见 app/globals.css 的 .writing-feed 规则），
 * 不需要把全部正文序列化进浏览器，也不会让页面退化成动态渲染。
 *
 * 筛选不写 URL：个人站里"全部/文章/瞬间/点子"是浏览器的临时状态，不值得
 * 为它引入 searchParams（那会让 /blog 每次请求都重新渲染）。
 */
export default function WritingFilter({
  labels,
  counts,
  groupLabel,
  children,
}: {
  labels: Labels;
  counts: Counts;
  groupLabel: string;
  children: ReactNode;
}) {
  const [filter, setFilter] = useState<WritingKind>("all");

  return (
    <div>
      <div role="group" aria-label={groupLabel} className="mb-6 flex flex-wrap gap-2">
        {ORDER.map((kind) => {
          const active = filter === kind;
          return (
            <button
              key={kind}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(kind)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-accent bg-accent text-white dark:text-surface"
                  : "border-border bg-surface-raised text-fg-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {labels[kind]}
              <span
                className={cn(
                  "font-mono text-xs",
                  active ? "opacity-70" : "text-fg-subtle",
                )}
              >
                {counts[kind]}
              </span>
            </button>
          );
        })}
      </div>

      <div data-filter={filter} className="writing-feed">
        {children}
      </div>
    </div>
  );
}

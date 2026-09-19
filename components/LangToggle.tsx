"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { type Lang } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const COOKIE = "NEXT_LOCALE";

/** 去掉路径开头的 /en 或 /zh，得到与语言无关的基础路径 */
function stripLangPrefix(pathname: string): string {
  const stripped = pathname.replace(/^\/(en|zh)(?=\/|$)/, "");
  return stripped === "" ? "/" : stripped;
}

export default function LangToggle({
  lang,
  label,
  className,
}: {
  lang: Lang;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const next: Lang = lang === "zh" ? "en" : "zh";

  const handleClick = useCallback(() => {
    // 写 cookie，使 proxy.ts 在回访者访问 / 时能直接跳到其偏好语言。
    // 旧实现写的是 localStorage，服务端读不到，等于没生效。
    document.cookie = `${COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;

    const base = stripLangPrefix(pathname ?? "/");
    router.push(base === "/" ? `/${next}` : `/${next}${base}`);
  }, [next, pathname, router]);

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-xl border border-border",
        "bg-surface-raised px-2.5 text-xs font-medium whitespace-nowrap",
        "transition-colors hover:border-border-strong hover:bg-surface-sunken",
        className,
      )}
    >
      <span className="font-semibold text-fg">
        {lang === "zh" ? "中文" : "EN"}
      </span>
      <span className="text-fg-subtle">/</span>
      <span className="text-fg-muted">{lang === "zh" ? "EN" : "中文"}</span>
    </button>
  );
}

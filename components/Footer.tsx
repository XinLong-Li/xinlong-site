import { cn } from "@/lib/cn";
import { formatFooter, getDictionary, type Lang } from "@/lib/i18n";

/**
 * 服务端组件。旧实现为了用 usePathname 判断语言而标了 "use client"，
 * 但语言已由路由段确定，直接作为 prop 传入即可。
 */
export default function Footer({
  lang,
  className,
}: {
  lang: Lang;
  className?: string;
}) {
  const t = getDictionary(lang);
  const text = formatFooter(t.footerTemplate, t.siteName, new Date().getFullYear());

  return (
    <footer className={cn("mt-16 border-t border-border py-6", className)}>
      <div className="mx-auto max-w-5xl px-5 text-center">
        <p className="text-sm text-fg-subtle">{text}</p>
      </div>
    </footer>
  );
}

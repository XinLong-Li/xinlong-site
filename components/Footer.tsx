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
    /*
     * 没有 border-t，也没有 mt。
     *
     * 去掉上边框：那是一条横贯整屏的硬线，把页面切成两半，和 bg-glow 那张
     * 连续渐变背景直接打架。页脚本来就该"融"进背景，而不是被一条线划出来。
     *
     * 去掉 mt-16：各页面的 <Container> 已经自带 py-16，底部那 64px 空白
     * 之上再叠 64px，合计 128px —— 这才是页脚"显得特别高"的真正原因，
     * 页脚本身并不高。留白交给 flex-1 的 main 去撑。
     */
    <footer className={cn("py-6", className)}>
      <div className="mx-auto max-w-5xl px-5 text-center">
        <p className="text-sm text-fg-subtle">{text}</p>
      </div>
    </footer>
  );
}

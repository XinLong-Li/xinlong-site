"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, Moon, Sun, X } from "lucide-react";

import LangToggle from "./LangToggle";
import { cn } from "@/lib/cn";
import { getDictionary, type Lang } from "@/lib/i18n";

const DRAWER_ID = "mobile-nav-drawer";

export default function Navigation({ lang }: { lang: Lang }) {
  const t = getDictionary(lang);
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();

  // 仅用于主题图标：resolvedTheme 在服务端为 undefined，直接渲染会导致
  // 水合不一致。注意这里是给单个图标加占位，而不是像旧实现那样把整条
  // 导航栏 `return null` —— 那会让固定导航每次导航都从无到有闪一下。
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const isDark = mounted && resolvedTheme === "dark";

  const close = useCallback((returnFocus = false) => {
    setIsOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // 路由变化时收起抽屉，否则跳转后它会悬在新页面上
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 抽屉打开时锁住页面滚动
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // 抽屉打开时把焦点移入面板，符合模态对话框的预期行为。
  useEffect(() => {
    if (!isOpen) return;
    const first = drawerRef.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    first?.focus();
  }, [isOpen]);

  // Escape 关闭并归还焦点；Tab 在面板内循环，不逃逸到背后的页面。
  //
  // 监听挂在 document 而非抽屉元素上：抽屉打开时焦点仍在汉堡按钮上，
  // 而它是抽屉的兄弟节点——挂在抽屉上的话，事件从按钮冒泡时根本不会
  // 经过抽屉，处理器永远不触发。
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  // 图标表示"点了会切到哪个状态"，而非当前状态。
  // 旧实现在 theme==="light" 时渲染太阳，两种惯例都不符合。
  const ThemeIcon = () => {
    if (!mounted) return <span className="block size-4" aria-hidden="true" />;
    return isDark ? <Sun size={16} /> : <Moon size={16} />;
  };

  const handleThemeToggle = () => setTheme(isDark ? "light" : "dark");

  const navItems = [
    { key: "blog", label: t.nav.blog, href: `/${lang}/blog` },
    { key: "projects", label: t.nav.projects, href: `/${lang}/projects` },
    { key: "resume", label: t.nav.resume, href: `/${lang}/resume` },
    { key: "contact", label: t.nav.contact, href: `/${lang}/contact` },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(`${href}/`);

  const navLinkClass = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-xs font-semibold tracking-wide uppercase",
      "transition-colors",
      isActive(href)
        ? "text-accent"
        : "text-fg-muted hover:bg-accent-soft/50 hover:text-accent",
    );

  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-[100] h-16",
        "border-b border-border bg-surface/80 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-full max-w-5xl items-center gap-4 px-5">
        {/* 旧实现是 <div onClick>，不可聚焦、非链接语义。用真正的 Link。 */}
        <Link
          href={`/${lang}`}
          className="shrink-0 text-lg font-bold text-fg transition-colors hover:text-accent"
        >
          {t.siteName}
        </Link>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={navLinkClass(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-2">
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label={t.theme.toggle}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl",
              "border border-border bg-surface-raised text-fg",
              "transition-colors hover:border-border-strong hover:bg-surface-sunken",
            )}
          >
            <ThemeIcon />
          </button>

          {/* 用包裹元素而不是给 LangToggle 传 "hidden"：
              它基类里已有 inline-flex，而 Tailwind 生成的 CSS 中 .hidden
              排在 .inline-flex 之前，同等特异性下后者胜出，类名压制无效。
              包裹元素可以完全绕开这个顺序依赖。 */}
          <span className="hidden md:inline-flex">
            <LangToggle lang={lang} label={t.langSwitch} />
          </span>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            aria-controls={DRAWER_ID}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-xl md:hidden",
              "border border-border bg-surface-raised text-fg",
              "transition-colors hover:border-border-strong hover:bg-surface-sunken",
            )}
          >
            {isOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* 抽屉只在打开时渲染——旧实现始终 display:block、仅靠 visibility 隐藏，
          导致桌面端其链接仍留在 Tab 序里，是真实的键盘陷阱。
          条件渲染从结构上杜绝了这一点，也省去了 exit 动画。
          md:hidden 兜底：若在移动端打开后把窗口拉宽，抽屉不会残留。 */}
      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => close()}
            className="fixed inset-x-0 bottom-0 top-16 z-[90] bg-black/40 md:hidden"
          />
          <div
            id={DRAWER_ID}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.siteName}
            className={cn(
              "absolute inset-x-0 top-full z-[120] md:hidden",
              "max-h-[calc(100dvh-4rem)] overflow-y-auto",
              "border-b border-border bg-surface/95 backdrop-blur-xl",
              "animate-[drawer-in_0.2s_ease-out]",
            )}
          >
            <div className="mx-auto max-w-5xl px-5 py-3">
              <div className="flex flex-col">
                {navItems.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "border-b border-border py-3 text-sm font-medium transition-colors last:border-b-0",
                      isActive(item.href)
                        ? "text-accent"
                        : "text-fg hover:text-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              {/* 与导航栏容器同一组 padding，因此和上方 logo 左对齐。
                  旧实现的 calc(100% - 100px) 会让抽屉链接错位。 */}
              <div className="mt-3 grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  aria-label={t.theme.toggle}
                  className={cn(
                    "inline-flex h-9 items-center justify-center gap-2 rounded-xl",
                    "border border-border bg-surface-raised px-2.5 text-xs",
                    "text-fg transition-colors hover:border-border-strong",
                  )}
                >
                  <ThemeIcon />
                  <span className="truncate">
                    {isDark ? t.theme.light : t.theme.dark}
                  </span>
                </button>
                <LangToggle
                  lang={lang}
                  label={t.langSwitch}
                  className="w-full justify-center"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

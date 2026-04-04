"use client";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { i18n, type Language } from "@/lib/i18n";
import Link from "next/link";
import { Sun, Moon, Menu, X } from "lucide-react";
import LangToggle from "./LangToggle";

export default function Navigation() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);

  // 判断当前语言（优先检查 /en 前缀）
  const currentLang: Language = pathname?.startsWith("/en") ? "en" : "zh";
  const t = i18n[currentLang];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (mobileDrawerRef.current?.contains(target)) return;
      if (mobileToggleRef.current?.contains(target)) return;

      setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  if (!mounted) return null;

  // 根据当前语言生成导航链接前缀（中英文同级：/en 与 /zh）
  const langPrefix = currentLang === "en" ? "/en" : "/zh";

  // 导航项
  const navItems = [
    { key: "blog", label: t.blog, href: `${langPrefix}/blog` },
    { key: "projects", label: t.projects, href: `${langPrefix}/projects` },
    { key: "resume", label: t.resume, href: `${langPrefix}/resume` },
    { key: "contact", label: t.contact, href: `${langPrefix}/contact` },
  ];

  // 处理主题切换 - 在 light 和 dark 之间切换
  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // 回到首页
  const handleLogoClick = () => {
    setIsMenuOpen(false);
    router.push(langPrefix);
  };

  // 网站名称
  const siteName = currentLang === "en" ? "Xinlong Li" : "李新龙";

  // 根据当前主题显示不同的图标组件
  const ThemeIcon = () => {
    if (theme === "light") return <Sun size={16} />;
    return <Moon size={16} />;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={handleLogoClick}>
          <span className="logo-text">{siteName}</span>
        </div>

        {/* 桌面端导航菜单 */}
        <div className="nav-menu desktop-only">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className="nav-item">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          <button
            className="icon-button"
            onClick={handleThemeToggle}
            aria-label="Toggle theme"
          >
            <ThemeIcon />
          </button>

          <LangToggle currentLang={currentLang} />

          <button
            ref={mobileToggleRef}
            className="icon-button mobile-toggle"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((v) => !v);
            }}
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      <div ref={mobileDrawerRef} className={`mobile-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="mobile-drawer-top">
        </div>

        <div className="drawer-links">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="drawer-link"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="drawer-divider" />
          <div className="drawer-control-row">
            <button
              className="drawer-theme-toggle"
              onClick={handleThemeToggle}
              aria-label="Toggle theme"
            >
              <ThemeIcon />
              <span>{theme === "light" ? t.themeLight : t.themeDark}</span>
            </button>
            <LangToggle currentLang={currentLang} />
          </div>
        </div>
      </div>

      {isMenuOpen && <div className="drawer-backdrop" onClick={() => setIsMenuOpen(false)} />}
    </nav>
  );
}

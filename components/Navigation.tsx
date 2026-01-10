"use client";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { i18n, type Language } from "@/lib/i18n";
import Link from "next/link";
import { Sun, Moon, MonitorSmartphone, Globe, Menu } from "lucide-react";

export default function Navigation() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const drawerThemeMenuRef = useRef<HTMLDivElement>(null);
  const drawerLangMenuRef = useRef<HTMLDivElement>(null);
  const [drawerThemeMenuOpen, setDrawerThemeMenuOpen] = useState(false);
  const [drawerLangMenuOpen, setDrawerLangMenuOpen] = useState(false);

  // 判断当前语言（优先检查 /en 前缀）
  const currentLang: Language = pathname?.startsWith("/en") ? "en" : "zh";
  const t = i18n[currentLang];

  useEffect(() => setMounted(true), []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
      if (drawerThemeMenuRef.current && !drawerThemeMenuRef.current.contains(event.target as Node)) {
        setDrawerThemeMenuOpen(false);
      }
      if (drawerLangMenuRef.current && !drawerLangMenuRef.current.contains(event.target as Node)) {
        setDrawerLangMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // 处理语言切换 — 保留当前页面路径
  const handleLangChange = (newLang: Language) => {
    // 提取基础路径（去掉 /en 或 /zh 前缀）
    let basePath = pathname || "/";
    if (basePath.startsWith("/en/")) basePath = basePath.slice(3);
    else if (basePath === "/en") basePath = "/";
    else if (basePath.startsWith("/zh/")) basePath = basePath.slice(3);
    else if (basePath === "/zh") basePath = "/";

    const prefix = newLang === "en" ? "/en" : "/zh";
    const newPath = basePath === "/" ? prefix : `${prefix}${basePath}`;
    setLangMenuOpen(false);
    router.push(newPath);
  };

  // 处理主题切换
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setThemeMenuOpen(false);
  };

  // 回到首页
  const handleLogoClick = () => {
    router.push(langPrefix);
  };

  // 网站名称
  const siteName = currentLang === "en" ? "Xinlong Li" : "李新龙";

  // 根据当前主题显示不同的图标组件
  const ThemeIcon = () => {
    if (theme === "light") return <Sun size={16} />;
    if (theme === "dark") return <Moon size={16} />;
    return <MonitorSmartphone size={16} />; // system/auto
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" onClick={handleLogoClick}>
          <button
            className="icon-button mobile-toggle"
            aria-label="Open menu"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen((v) => !v);
            }}
          >
            <Menu size={18} />
          </button>
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
          <div className="dropdown" ref={themeMenuRef}>
            <button
              className="icon-button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              aria-label="Toggle theme"
            >
              <ThemeIcon />
            </button>
            {themeMenuOpen && (
              <div className="dropdown-menu">
                <button onClick={() => handleThemeChange("system")} className="dropdown-item">
                  <span>{t.themeAuto}</span>
                  <MonitorSmartphone size={14} />
                </button>
                <button onClick={() => handleThemeChange("light")} className="dropdown-item">
                  <span>{t.themeLight}</span>
                  <Sun size={14} />
                </button>
                <button onClick={() => handleThemeChange("dark")} className="dropdown-item">
                  <span>{t.themeDark}</span>
                  <Moon size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="dropdown" ref={langMenuRef}>
            <button
              className="icon-button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              aria-label="Toggle language"
            >
              <Globe size={16} />
            </button>
            {langMenuOpen && (
              <div className="dropdown-menu">
                <button onClick={() => handleLangChange("zh")} className="dropdown-item">
                  {t.langZh}
                </button>
                <button onClick={() => handleLangChange("en")} className="dropdown-item">
                  {t.langEn}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 移动端抽屉菜单 */}
      <div className={`mobile-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="drawer-header">
          <span className="logo-text">{siteName}</span>
          <button
            className="icon-button"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        {/* 抽屉菜单不显示主题和语言切换按钮 */}

        <div className="drawer-links">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className="drawer-link">
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {isMenuOpen && <div className="drawer-backdrop" onClick={() => setIsMenuOpen(false)} />}
    </nav>
  );
}

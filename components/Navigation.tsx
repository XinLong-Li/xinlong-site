"use client";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { i18n, type Language } from "@/lib/i18n";
import Link from "next/link";

export default function Navigation() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 判断当前语言（优先检查 /en 前缀）
  const currentLang: Language = pathname?.startsWith("/en") ? "en" : "zh";
  const t = i18n[currentLang];

  useEffect(() => setMounted(true), []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  if (!mounted) return null;

  // 根据当前语言生成导航链接前缀（中英文同级：/en 与 /zh）
  const langPrefix = currentLang === "en" ? "/en" : "/zh";

  // 导航项
  const navItems = [
    { key: "home", label: t.home, href: `${langPrefix}` },
    { key: "blog", label: t.blog, href: `${langPrefix}#blog` },
    { key: "gallery", label: t.gallery, href: `${langPrefix}/gallery` },
    { key: "resume", label: t.resume, href: `${langPrefix}#resume` },
    { key: "contact", label: t.contact, href: `${langPrefix}#contact` },
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
    router.push(newPath);
  };

  // 处理主题切换
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`${langPrefix}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  // 回到首页
  const handleLogoClick = () => {
    router.push(langPrefix);
  };

  // 网站名称
  const siteName = currentLang === "en" ? "Xinlong Li" : "李新龙";

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
            ☰
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
          <div className="search-container desktop-only">
            <button
              className="icon-button"
              onClick={() => setSearchOpen(!searchOpen)}
              title={t.search}
            >
              🔍
            </button>
            {searchOpen && (
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="search-input"
                />
              </form>
            )}
          </div>

          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={t.theme}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>

          <button
            className="pill-button"
            onClick={() => handleLangChange(currentLang === "en" ? "zh" : "en")}
            aria-label="Toggle language"
          >
            {currentLang === "en" ? "中文" : "English"}
          </button>
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

        <form onSubmit={handleSearch} className="drawer-search">
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="drawer-search-input"
          />
          <button type="submit" className="pill-button">
            🔍
          </button>
        </form>

        <div className="drawer-actions">
          <button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            className="pill-button"
            onClick={() => handleLangChange(currentLang === "en" ? "zh" : "en")}
          >
            {currentLang === "en" ? "中文" : "English"}
          </button>
        </div>

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

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

  // 判断当前语言（优先检查 /en 前缀）
  const currentLang: Language = pathname?.startsWith("/en") ? "en" : "zh";
  const t = i18n[currentLang];

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  // 根据当前语言生成导航链接前缀
  const langPrefix = currentLang === "en" ? "/en" : "";

  // 导航项
  const navItems = [
    { key: "home", label: t.home, href: `${langPrefix}/` },
    { key: "blog", label: t.blog, href: `${langPrefix}/blog` },
    { key: "archives", label: t.archives, href: `${langPrefix}/archives` },
    { key: "tag", label: t.tag, href: `${langPrefix}/tag` },
    { key: "links", label: t.links, href: `${langPrefix}/links` },
    { key: "about", label: t.about, href: `${langPrefix}/about` },
    { key: "books", label: t.books, href: `${langPrefix}/books` },
    { key: "resume", label: t.resume, href: `${langPrefix}/resume` },
    { key: "contact", label: t.contact, href: `${langPrefix}/contact` },
  ];

  // 处理语言切换 — 保留当前页面路径
  const handleLangChange = (newLang: Language) => {
    // 从当前路径中提取基础路径（去掉语言前缀）
    let basePath = pathname;
    if (pathname.startsWith("/en/")) {
      basePath = pathname.slice(3); // 去掉 /en
    } else if (pathname === "/en") {
      basePath = "/";
    }
    // 如果是中文且路径是 /，则保持 /
    if (basePath === "") basePath = "/";

    const newPath = newLang === "en" ? `/en${basePath}` : basePath;
    router.push(newPath);
  };

  // 处理主题切换
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
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
    router.push(langPrefix === "/en" ? "/en" : "/");
  };

  // 网站名称
  const siteName = currentLang === "en" ? "Xinlong Li" : "李新龙";

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={handleLogoClick}>
          <span className="logo-text">{siteName}</span>
        </div>

        {/* 导航菜单 */}
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link key={item.key} href={item.href} className="nav-item">
              {item.label}
            </Link>
          ))}
        </div>

        {/* 右侧操作栏 */}
        <div className="navbar-actions">
          {/* 搜索框 */}
          <div className="search-container">
            <button
              className="search-button"
              onClick={() => setSearchOpen(!searchOpen)}
              title="Search"
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

          {/* 主题下拉 */}
          <div className="dropdown">
            <button className="dropdown-button">
              {theme === "light" && "☀️"}
              {theme === "dark" && "🌙"}
              {(!theme || theme === "system") && "⚙️"}
            </button>
            <div className="dropdown-menu">
              <button
                onClick={() => handleThemeChange("light")}
                className={theme === "light" ? "active" : ""}
              >
                ☀️ {t.themeLight}
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={theme === "dark" ? "active" : ""}
              >
                🌙 {t.themeDark}
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={theme === "system" || !theme ? "active" : ""}
              >
                ⚙️ {t.themeSystem}
              </button>
            </div>
          </div>

          {/* 语言下拉 */}
          <div className="dropdown">
            <button className="dropdown-button">
              {currentLang === "zh" ? "中文" : "English"}
            </button>
            <div className="dropdown-menu">
              <button
                onClick={() => handleLangChange("zh")}
                className={currentLang === "zh" ? "active" : ""}
              >
                中文
              </button>
              <button
                onClick={() => handleLangChange("en")}
                className={currentLang === "en" ? "active" : ""}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

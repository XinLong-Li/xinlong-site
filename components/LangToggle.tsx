"use client";
import { useRouter, usePathname } from "next/navigation";
import { type Language } from "@/lib/i18n";

interface LangToggleProps {
  currentLang: Language;
}

export default function LangToggle({ currentLang }: LangToggleProps) {
  const router = useRouter();
  const pathname = usePathname();

  const nextLang: Language = currentLang === "zh" ? "en" : "zh";

  const handleLangChange = (newLang: Language) => {
    if (newLang === currentLang) return;

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

  return (
    <div className="lang-toggle-wrapper">
      <button
        className={`lang-toggle-flip ${currentLang}`}
        onClick={() => handleLangChange(nextLang)}
        aria-label={currentLang === "zh" ? "Switch to English" : "Switch to Chinese"}
      >
        <span className="lang-current">{currentLang === "zh" ? "中文" : "EN"}</span>
        <span className="lang-sep">/</span>
        <span className="lang-next">{currentLang === "zh" ? "EN" : "中文"}</span>
      </button>
    </div>
  );
}

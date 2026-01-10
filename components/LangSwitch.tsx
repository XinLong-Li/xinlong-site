"use client";
import { useRouter, usePathname } from "next/navigation";

export default function LangSwitch() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const isZh = pathname.startsWith("/zh");
  const isEn = pathname.startsWith("/en");
  let basePath = pathname;
  if (isZh) basePath = basePath.slice(3);
  else if (isEn) basePath = basePath.slice(3);
  const targetLang = isZh ? "en" : "zh";
  const target = basePath === "/" ? `/${targetLang}` : `/${targetLang}${basePath}`;
  return (
    <button className="button" onClick={() => router.push(target)}>
      {isZh ? "English" : "中文"}
    </button>
  );
}

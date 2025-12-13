"use client";
import { useRouter, usePathname } from "next/navigation";

export default function LangSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const isZh = pathname?.startsWith("/zh") || pathname === "/";
  const target = isZh ? "/en" : "/zh";
  return (
    <button className="button" onClick={() => router.push(target)}>
      {isZh ? "English" : "中文"}
    </button>
  );
}

"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith("/en");
  
  const currentYear = new Date().getFullYear();
  const name = isEnglish ? "Xinlong Li" : "李新龙";
  const text = isEnglish 
    ? `Designed & Built by ${name}` 
    : `由 ${name} 设计与开发`;

  return (
    <footer className="footer">
      <div className="footer-content">
        <p>{text} © {currentYear}</p>
      </div>
    </footer>
  );
}

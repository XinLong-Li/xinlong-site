"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

type Zoomed = { src: string; alt: string };

/**
 * 正文图片的灯箱。
 *
 * 图片本身由 lib/rehype-image-links.ts 包成 `<a data-zoom>`；这个组件只做
 * 一件事：拦下这些链接的点击，用浮层展示原图。
 *
 * - 不渲染任何东西，挂载一次覆盖全站；
 * - 不拦修饰键点击（Cmd/Ctrl/Shift/中键），那些仍然走链接本身的"新标签打开"；
 * - 没有 JS 时链接照常工作 —— 这是渐进增强，不是替代方案。
 */
export default function ImageZoom({ closeLabel }: { closeLabel: string }) {
  const [zoomed, setZoomed] = useState<Zoomed | null>(null);
  const pathname = usePathname();

  // 客户端导航后关掉，免得浮层悬在新页面上。
  useEffect(() => {
    setZoomed(null);
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      // 让修饰键点击保持浏览器默认行为（新标签/新窗口）。
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>("a[data-zoom]");
      if (!link) return;

      const img = link.querySelector("img");
      const src = link.getAttribute("href") ?? img?.getAttribute("src");
      if (!src) return;

      event.preventDefault();
      setZoomed({ src, alt: img?.getAttribute("alt") ?? "" });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!zoomed) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(null);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [zoomed]);

  if (!zoomed) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={zoomed.alt || closeLabel}
      onClick={() => setZoomed(null)}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        autoFocus
        onClick={(event) => {
          event.stopPropagation();
          setZoomed(null);
        }}
        aria-label={closeLabel}
        className="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {/* 原图的尺寸未知，用 max-* 约束；点击图片本身不关闭，点背景才关。 */}
      <img
        src={zoomed.src}
        alt={zoomed.alt}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
      />
    </div>
  );
}

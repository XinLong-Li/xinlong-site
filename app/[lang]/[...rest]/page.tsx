import { notFound } from "next/navigation";

/**
 * 兜底路由，本身不渲染任何内容。
 *
 * 存在的理由：根布局位于 app/[lang] 动态段内，URL 若匹配不到任何路由，
 * Next 会直接渲染内置 404，完全绕过布局树——那个页面没有导航也没有页脚，
 * 用户进了死胡同。而 global-not-found.tsx 这个官方解法在 Turbopack
 * （Next 16 默认构建器）上尚未实现。
 *
 * 因此由 proxy.ts 把未匹配的路径重写进语言段，落到这里，再调用
 * notFound() 触发最近的 not-found 边界（app/[lang]/not-found.tsx）。
 * notFound() 会让响应保持 404 状态码，不会变成软 404。
 *
 * 显式路由（/blog、/projects 等）优先于 catch-all，不受影响。
 */
export default function CatchAllPage(): never {
  notFound();
}

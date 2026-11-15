"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * React 19 会对 next-themes 在组件树里注入的主题初始化 `<script>` 报
 * "Encountered a script tag while rendering React component"。
 *
 * 0.4.6 的 `scriptProps` 允许把**客户端**那颗副本标成 application/json：
 * 它变成惰性数据，不执行、也不触发 React 的 script 警告；服务端那份仍然是
 * 真正的 `<script>`，在首帧前执行，深色模式不会闪白。
 *
 * `typeof window` 必须在模块里判断：服务端渲染时不能带 scriptProps，
 * 否则初始化脚本根本不会执行。
 */
const scriptProps =
  typeof window === "undefined" ? undefined : { type: "application/json" };

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      scriptProps={scriptProps}
    >
      {children}
    </ThemeProvider>
  );
}

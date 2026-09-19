/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 注：根布局位于 app/[lang] 动态段内，未匹配的路径由 proxy.ts 重写进
  // 语言段，落到 app/[lang]/not-found.tsx。
  // 未启用 experimental.globalNotFound —— Turbopack（Next 16 默认构建器）
  // 尚未实现该文件约定，开启后标志会被识别但文件不生效（实测构建产物中
  // 不含 global-not-found chunk）。相关逻辑目前只存在于 webpack 的
  // next-app-loader 中。
};
module.exports = nextConfig;

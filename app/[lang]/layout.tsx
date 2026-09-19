import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import localFont from "next/font/local";

import "../globals.css";
import Providers from "../providers";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { getDictionary, htmlLang, isLang, LANGS } from "@/lib/i18n";

const SITE_URL = "https://xinlong-li.site";

/**
 * 字体自托管，刻意不用 next/font/google。
 *
 * 部署流程（.github/workflows/deploy-tencent.yml）会在腾讯云服务器上再跑
 * 一次 `npm run build`。next/font/google 是构建时下载字体，而大陆服务器
 * 通常访问不了 Google，那会导致部署直接失败。把 woff2 提交进仓库后，
 * 构建期零网络依赖。
 *
 * 只取 latin 子集。中文 webfont 是数 MB 级，会主导整站体积——CJK 码位
 * 由 globals.css 里 --font-sans 的系统字体栈兜底（PingFang SC 等）。
 * 拉丁字形被第一个字体族接管，中文自然回落，这是双语小站的标准做法。
 */
const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  variable: "--font-latin",
  display: "swap",
  weight: "400 700",
});

const jetbrainsMono = localFont({
  src: "../fonts/jetbrains-mono-latin.woff2",
  variable: "--font-mono-latin",
  display: "swap",
  weight: "400 600",
});

/**
 * 这是应用的根布局。
 *
 * 它位于动态路由段内，因此 app/layout.tsx 已被删除——Next 16 的规则是
 * "根布局 = 之上没有其他布局的布局"。如果顶层那个保留了，它会被选为根布局，
 * 本文件就降级成无法输出 <html> 的嵌套布局。二者不存在可共存的中间状态。
 *
 * 因为根布局在动态段里，像 /nonexistent 这种匹配不到任何路由的路径没有布局树
 * 可渲染 404，会落到 Next 内置的裸错误页。官方解法 global-not-found.tsx 在
 * Turbopack（Next 16 默认构建器）上尚未实现，因此改由 proxy.ts 把这类路径
 * 重写进语言段，落到 app/[lang]/[...rest]/page.tsx 再触发 not-found 边界。
 */
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};

  const t = getDictionary(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.siteName, template: `%s — ${t.siteName}` },
    description: t.siteDescription,
    openGraph: {
      type: "website",
      siteName: t.siteName,
      locale: lang === "zh" ? "zh_CN" : "en_US",
      url: `/${lang}`,
    },
    twitter: { card: "summary_large_image" },
    alternates: {
      canonical: `/${lang}`,
      languages: { "zh-CN": "/zh", en: "/en" },
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: ReactNode;
  // 动态路由参数运行时是 string，不是联合类型——手写联合类型会导致构建失败。
  // 用 isLang 做运行时收窄。
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);

  return (
    <html
      lang={htmlLang(lang)}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          <div className="bg-glow" aria-hidden="true" />
          {/* 只传 lang，不传整个字典：字典含全部页面文案，序列化给客户端
              组件会把它整份塞进浏览器包。两个组件各自按 lang 取所需部分。 */}
          <Navigation lang={lang} />
          {/* 各页面自行包 <Container>，横向尺度由它单点定义 */}
          <main>{children}</main>
          <Footer lang={lang} />
        </Providers>
      </body>
    </html>
  );
}

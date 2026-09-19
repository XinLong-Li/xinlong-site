import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LANG, isLang, type Lang } from "@/lib/i18n";

export const LOCALE_COOKIE = "NEXT_LOCALE";

const HAS_LOCALE_PREFIX = /^\/(zh|en)(\/|$)/;

/**
 * 语言判定优先级：已保存的 cookie → Accept-Language 请求头 → 默认值。
 *
 * 注意这里读的是 cookie 而非 localStorage。旧 splash 页写的是
 * localStorage.preferredLanguage，那是客户端存储，服务端读不到，
 * 因此全站没有任何代码消费它——重定向必须在服务端完成，cookie 是
 * 唯一能让回访者偏好生效的机制。
 */
function pickLang(req: NextRequest): Lang {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLang(cookie)) return cookie;

  const header = req.headers.get("accept-language") ?? "";
  // 形如 "zh-CN,zh;q=0.9,en;q=0.8" —— 出现 zh 即判为中文
  if (/(^|,)\s*zh\b/i.test(header)) return "zh";

  return DEFAULT_LANG;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) 根路径 → 302 跳转到协商出的语言
  //
  // 必须显式传 302。NextResponse.redirect 默认返回 307，而
  // .github/workflows/uptime-monitor.yml 只接受 200/301/302
  // （`grep -q "200\|301\|302"`）——用默认值会让监控在生产环境误报
  // 故障，且本地怎么测都测不出来。
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = `/${pickLang(req)}`;
    return NextResponse.redirect(url, 302);
  }

  // 2) 已带语言前缀的路径，正常放行
  if (HAS_LOCALE_PREFIX.test(pathname)) return NextResponse.next();

  // 3) 未匹配到任何路由的路径 → 重写到语言段内，让它落到
  //    app/[lang]/not-found.tsx（带导航和页脚），而不是 Next 内置的裸 404 页。
  //
  //    之所以不用 global-not-found.tsx：Next 16 的默认构建器 Turbopack
  //    尚未实现该文件约定——相关逻辑只存在于 webpack 的 next-app-loader 里，
  //    实测构建产物中不含 global-not-found chunk，页面仍渲染内置错误页。
  //    URL 保持不变（rewrite 而非 redirect）。
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLang(req)}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // 排除 API、Next 内部资源与带扩展名的静态文件（favicon.ico、icon.svg 等）。
  // 其余路径需要经过本文件，才能让上面的重写兜底生效。
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};

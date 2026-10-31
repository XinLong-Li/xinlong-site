"use client";

import { useEffect } from "react";

import { halloweenEnabled } from "@/lib/halloween";

const PUMPKIN_ICON = "/halloween.svg";

/**
 * 万圣节彩蛋的行为层：只做副作用，不渲染任何东西。
 *
 * 10 月 31 日（或 `?halloween=1`）时：
 *   - 给 <html> 打上 data-halloween，CSS 据此把背景光晕换成南瓜色、
 *     在站名后面挂一只 🎃（见 app/globals.css）；
 *   - 把 favicon 换成南瓜灯；
 *   - 在控制台留一句问候。
 *
 * 为什么放在 effect 里：服务端不知道访问者的日期，渲染期加标记会造成
 * hydration 不一致。首帧和访客完全一样，挂载后才"换装"。
 * 第二天重新打开页面就自动恢复 —— 不留下任何长期装饰。
 */
export default function Halloween() {
  useEffect(() => {
    if (!halloweenEnabled(new Date(), window.location.search)) return;

    const root = document.documentElement;
    root.dataset.halloween = "";

    // 记下原来的 favicon，卸载时还原（StrictMode 下会走一次卸载再挂载）。
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
    );
    const previous = links.map((link) => link.getAttribute("href"));
    for (const link of links) link.setAttribute("href", PUMPKIN_ICON);

    // 没有 icon link 的兜底，免得换了半天什么也没发生。
    let created: HTMLLinkElement | null = null;
    if (links.length === 0) {
      created = document.createElement("link");
      created.rel = "icon";
      created.href = PUMPKIN_ICON;
      document.head.appendChild(created);
    }

    console.log("%c🎃 Happy Halloween", "font-size:16px");

    return () => {
      delete root.dataset.halloween;
      links.forEach((link, i) => {
        const href = previous[i];
        if (href) link.setAttribute("href", href);
      });
      created?.remove();
    };
  }, []);

  return null;
}

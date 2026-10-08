"use client";

import { useEffect } from "react";

/** "已复制"停留时长：够看清，又不至于让按钮长期停在反馈态。 */
const FEEDBACK_MS = 1600;

/**
 * 复制。`navigator.clipboard` 只在安全上下文里存在（生产站是 HTTPS，
 * `localhost` 也算安全上下文），而局域网里用 `http://192.168.x.x:3000` 调试时它是
 * undefined —— 那种情况下退回已废弃的 `execCommand`，仍然比什么都不做好。
 *
 * 文档失焦时 `writeText` 会 reject（比如 DevTools 抢走了焦点），所以 reject 也要
 * 继续往下走降级，不能直接判失败。
 */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* 落到下面的降级路径 */
    }
  }
  return execCommandCopy(text);
}

function execCommandCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  // 固定定位 + 透明 + 移出可视区：既不闪一下，也不会把页面滚走。
  area.style.position = "fixed";
  area.style.top = "-1000px";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  // iOS Safari 对 select() 的选区处理不一致，显式再设一次范围。
  area.setSelectionRange(0, text.length);

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}

/**
 * 代码块复制按钮的行为层。
 *
 * 按钮本身是服务端烤进正文 HTML 的（见 lib/rehype-code-blocks.ts）。这个组件
 * **不渲染任何东西、不接任何 props**，只挂一个委托监听，于是：
 *
 *   - 不需要 ref，也不需要把正文交给客户端组件重渲染（正文是
 *     `dangerouslySetInnerHTML` 的字符串，重渲染就得整份序列化进浏览器包）；
 *   - 一个监听覆盖全页所有代码块，客户端导航换页后新出现的按钮也自动生效；
 *   - 禁用 JS 时读者看到的是**有高亮、没有按钮**的代码块，而不是一个点不动的死
 *     按钮 —— 按钮默认 `display: none`，由 `html[data-copy-ready]` 揭示
 *     （见 app/globals.css），而那个属性只有这个组件挂载后才存在。
 *
 * 文案从按钮自己的 `data-*-label` 上读，所以整份 i18n 字典不必序列化进客户端 ——
 * 这也是 app/[lang]/layout.tsx 里那条"只传 lang，不传字典"的注释所要求的。
 */
export default function CodeCopy() {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.copyReady = "";
    const timers = new Map<HTMLButtonElement, number>();

    function flash(button: HTMLButtonElement, state: "copied" | "failed") {
      const label =
        (state === "copied"
          ? button.dataset.copiedLabel
          : button.dataset.failedLabel) ??
        button.dataset.copyLabel ??
        "";

      // 连点时要重新计时，而不是让先前的计时器把新反馈提前抹掉。
      const pending = timers.get(button);
      if (pending !== undefined) window.clearTimeout(pending);

      button.dataset.state = state;
      button.textContent = label;
      timers.set(
        button,
        window.setTimeout(() => {
          delete button.dataset.state;
          button.textContent = button.dataset.copyLabel ?? "";
          timers.delete(button);
        }, FEEDBACK_MS),
      );
    }

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const button = target.closest<HTMLButtonElement>("[data-code-copy]");
      if (!button) return;

      // 读 <code> 而不是 <pre>：按钮是 <pre> 的兄弟节点，但万一将来结构变了，
      // 从 code 取纯文本永远是对的（高亮的 span 不改变 textContent）。
      const code = button.closest("[data-code-block]")?.querySelector("code");
      if (!code) return;

      void copyText(code.textContent ?? "").then((ok) => {
        if (ok) {
          flash(button, "copied");
          return;
        }
        // 降级也失败了：把代码选中，让用户至少能手动 Ctrl+C。
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = document.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        flash(button, "failed");
      });
    }

    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("click", onClick);
      for (const timer of timers.values()) window.clearTimeout(timer);
      timers.clear();
      delete root.dataset.copyReady;
    };
  }, []);

  return null;
}

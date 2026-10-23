/**
 * "这个浏览器登录过后台"的本地提示，只决定导航栏要不要显示入口。
 *
 * **它不是凭证。** 里面没有任何可用于鉴权的东西；伪造它最多让你看到一个
 * 指向 /admin 的链接，而真正的门是那边的会话校验。这和 WordPress 文档里
 * 强调的"隐藏菜单项不等于访问控制"是同一个边界。
 *
 * 为什么不用 cookie 或服务端判断：公开页面是构建期预渲染 + 60s ISR，在
 * layout 里读 cookies() 会让**全站**退化成动态渲染。这里只在浏览器里记
 * 一个布尔值，公开页面的渲染行为完全不变。
 *
 * 写入方是后台的两个客户端组件，因此这个值始终反映"最后一次看到的真实
 * 登录状态"：
 *   AdminPanel 挂载（服务端已确认会话有效）→ 置为 true
 *   LoginForm  挂载（未登录）              → 清掉
 */

const KEY = "xinlong:admin:hint";
/** 同标签页里 cookie 和 localStorage 都不会通知 —— 自己派发一个事件。 */
export const ADMIN_HINT_EVENT = "xinlong:admin-hint";

export function readAdminHint(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdminHint(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // 存不了就当作没有入口：不影响登录、编辑或发布。
  }
  window.dispatchEvent(new Event(ADMIN_HINT_EVENT));
}

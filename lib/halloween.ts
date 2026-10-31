/**
 * 万圣节彩蛋的开关判断。
 *
 * 用**访问者的本地日期**，而不是服务器时区：各地万圣节到来的时刻不同，
 * 让每个人在自己的 10 月 31 日看到它反而更自然。
 *
 * `?halloween=1` 强制打开、`?halloween=0` 强制关闭 —— 否则一年只有一天
 * 能验证这段逻辑，调试和给朋友演示都不方便。
 *
 * 保持纯函数：DOM 操作全部留在 components/Halloween.tsx，这里可以直接单测。
 */
export function halloweenEnabled(now: Date, search: string): boolean {
  const flag = new URLSearchParams(search).get("halloween");
  if (flag === "1") return true;
  if (flag === "0") return false;

  // getMonth() 从 0 开始：9 = 十月。
  return now.getMonth() === 9 && now.getDate() === 31;
}

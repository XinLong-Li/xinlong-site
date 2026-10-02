"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE,
  isLockedOut,
  isValidSessionToken,
  issueSessionToken,
  recordLoginFailure,
  resetLoginAttempts,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { moments, posts } from "@/lib/content";
import { serializeFrontmatter } from "@/lib/frontmatter";
import { getRepoRef, type RepoRef } from "@/lib/github";
import { isLang, type Lang } from "@/lib/i18n";
import { isSafeSlug } from "@/lib/slug";

/**
 * 这个文件里只剩三件事：登录、登出、把 GitHub token 交给已认证的客户端。
 *
 * **内容写入不再经过服务端** —— 全部由浏览器直接调 GitHub Contents API
 * （见 lib/github-client.ts）。原因是服务器推不了 GitHub：这台腾讯云服务器
 * 访问 github.com 会被 TLS 间歇重置（部署流程里 `git fetch` 那个老问题），
 * push 走同一条链路。
 *
 * 随之消失的还有原来的 `invalidate()`（clearCache + revalidatePath）。
 * 那两行的顺序是上一轮最容易出错的地方，而提交 git 的路径上 revalidatePath
 * 本来就没有意义 —— 内容要等部署重新构建才会出现。
 */

/**
 * 从 FormData 里取语言，并校验。
 * 不信任客户端传来的任何值——lang 会拼进重定向 URL。
 */
function readLang(formData: FormData): Lang | null {
  const raw = String(formData.get("lang") ?? "");
  return isLang(raw) ? raw : null;
}

/**
 * 鉴权断言。**每一个**对外暴露的 action 的第一行都必须调它 ——
 * 包括只读的 getRepoRef，因为它交付的是一枚能写仓库的凭证。
 *
 * **刻意不放在 proxy.ts 里**，三条理由：
 *  1. proxy 的 matcher 显式排除了 /api，放在那里的检查对 API 路由不存在；
 *  2. 同一个 /[lang]/admin 既要给未认证用户渲染登录表单、又要给已认证用户
 *     渲染编辑器，middleware 区分不了"来读表单"和"来提交数据"，无法用它
 *     做放行/拦截；
 *  3. 纵深防御——即使以后在 proxy 里也加了检查，这里仍必须独立再查一次。
 *
 * 也**不能依赖 Next 内置的 Server Action origin 校验**：读
 * node_modules/next/dist/server/app-render/action-handler.js 可见，缺少
 * Origin 头的请求只打一条 warning 就放行（源码注释原文："We'll let this
 * through but log a warning."）。它不是一道防线。
 */
export async function requireAuth(): Promise<void> {
  const store = await cookies();
  if (!isValidSessionToken(store.get(SESSION_COOKIE)?.value)) {
    // 抛错而非 redirect：redirect 会让"未认证的写入"在客户端看起来像成功
    // （页面跳转到了登录页），而抛错让调用方拿到明确的失败。
    throw new Error("unauthorized");
  }
}

/**
 * 登录。全站唯一不需要 requireAuth 的 action，因此它有独立的守卫：
 * 限速 + 密码校验。
 */
export async function loginAction(formData: FormData): Promise<void> {
  const lang = readLang(formData);
  if (!lang) redirect("/");

  if (isLockedOut()) {
    redirect(`/${lang}/admin?error=locked`);
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    recordLoginFailure();
    redirect(`/${lang}/admin?error=bad`);
  }

  resetLoginAttempts();
  const store = await cookies();
  store.set(SESSION_COOKIE, issueSessionToken(), sessionCookieOptions());

  // 登录不改动任何内容，因此不做 revalidatePath。
  redirect(`/${lang}/admin`);
}

export async function logoutAction(formData: FormData): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);

  const lang = readLang(formData);
  redirect(lang ? `/${lang}/admin` : "/");
}

/**
 * 把仓库坐标和 token 交给已认证的客户端。
 *
 * token 只在这里出现一次，之后只存在于浏览器的**内存**里 —— 不写
 * localStorage、不写 cookie。admin 页面会渲染用户写的 markdown，把长期
 * 凭证放进一个渲染用户输入的页面的持久存储里，是在赌 remark-html 的转义。
 *
 * 未配置 GITHUB_SYNC_TOKEN 时 getRepoRef 会抛明确错误，客户端把它显示出来
 * （而不是在服务端静默返回 null —— 那样用户只会看到一个不工作的编辑器）。
 */
export type RepoRefResult =
  | { ok: true; ref: RepoRef }
  | { ok: false; error: string };

export async function getRepoRefAction(): Promise<RepoRefResult> {
  // ⚠️ 这里**不能抛错**。
  //
  // server action 抛出的异常在生产构建里会被 React 包装成
  // "Minified React error #441"，错误原文根本到不了客户端 —— 实测确认过。
  // 而这条消息正是用来告诉用户"服务端没配 token，去哪里配"的，
  // 被压缩成错误码就完全失去意义了。
  //
  // 所以预期内的失败一律**返回**，不抛。只有真正异常的情况才让异常冒出去。
  const store = await cookies();
  if (!isValidSessionToken(store.get(SESSION_COOKIE)?.value)) {
    return { ok: false, error: "会话已过期，请刷新页面重新登录。" };
  }

  try {
    return { ok: true, ref: getRepoRef() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * 读服务器上的**遗留草稿**。
 *
 * 这套运行时写入机制已经拆掉了（内容现在一律走 git），但服务器磁盘上还
 * 留着当初从这里发布的文章。它们不在仓库里，所以浏览器拿不到 —— 只能由
 * 服务端读出来交给编辑器。用户保存一次，这篇就被提交进仓库，随之升级成
 * 正式内容，runtime 副本退化成被 git 优先规则遮蔽的影子。
 *
 * 这是唯一还读 runtime 的地方，属于过渡期的兼容代码。
 */
export async function readRuntimeDraftAction(
  lang: Lang,
  kind: "post" | "moment",
  slug: string,
): Promise<string | null> {
  await requireAuth();
  if (!isLang(lang) || !isSafeSlug(slug)) return null;

  const collection = kind === "post" ? posts : moments;
  const draft = collection.readRuntime(lang, slug);
  if (!draft) return null;

  // 重新序列化一遍，把 frontmatter 归一成当前格式（旧文件可能是手写的）。
  return serializeFrontmatter(
    {
      title: draft.data.title,
      date: draft.data.date,
      tags: Array.isArray(draft.data.tags) ? draft.data.tags : [],
      summary: typeof draft.data.summary === "string" ? draft.data.summary : "",
      lang,
    },
    draft.content,
  );
}

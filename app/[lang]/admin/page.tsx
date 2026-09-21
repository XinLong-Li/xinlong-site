import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Container from "@/components/Container";
import { SESSION_COOKIE, isValidSessionToken, remainingLockoutMinutes } from "@/lib/auth";
import { moments, posts } from "@/lib/content";
import { getDictionary, isLang } from "@/lib/i18n";
import { logoutAction } from "./actions";
import Editor, { type EditorInitial } from "./Editor";
import LoginForm from "./LoginForm";
import RuntimeList, { type RuntimeEntry } from "./RuntimeList";

/**
 * 管理后台。**不加 generateStaticParams、不加 revalidate。**
 *
 * 这个路由读 cookie 来决定渲染登录表单还是编辑器，必须按请求动态渲染。
 * 若被预渲染成静态页，未认证的访客会看到构建时的快照——那是登录页还是
 * 编辑器完全取决于构建那一刻的 cookie 状态，是个严重的错误。
 * `cookies()` 会让 Next 自动把该路由标记为动态。
 */
export const metadata: Metadata = {
  title: "Admin",
  // 双保险：next.config.js 里还有 X-Robots-Tag 响应头（那是强制的，
  // 而 robots.txt 的 Disallow 只是"请求"）。
  robots: { index: false, follow: false },
};

type Search = {
  error?: string;
  ok?: string;
  edit?: string;
  kind?: string;
};

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Search>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const { error, ok, edit, kind } = await searchParams;

  const store = await cookies();
  const authed = isValidSessionToken(store.get(SESSION_COOKIE)?.value);

  if (!authed) {
    return (
      <Container className="pb-16">
        <LoginForm
          lang={lang}
          labels={{
            password: t.admin.password,
            signIn: t.admin.signIn,
            wrongPassword: t.admin.wrongPassword,
            lockedOut: t.admin.lockedOut.replace(
              "{minutes}",
              String(remainingLockoutMinutes()),
            ),
          }}
          error={error}
        />
      </Container>
    );
  }

  /* 编辑目标：走 query 而不是客户端 state，这样刷新和分享链接都能回到同一
     篇。slug 只用于定位，实际内容从磁盘读，不接受客户端传来的正文。 */
  let initial: EditorInitial | undefined;
  if (edit && (kind === "post" || kind === "moment")) {
    const collection = kind === "post" ? posts : moments;
    const found = collection.readRuntime(lang, edit);
    if (found) {
      initial = {
        kind,
        slug: edit,
        title: String(found.data.title ?? ""),
        tags: Array.isArray(found.data.tags) ? (found.data.tags as string[]).join(", ") : "",
        body: found.content.trim(),
      };
    }
  }

  const runtimeEntries: RuntimeEntry[] = [
    ...posts.listRuntime(lang).map((i) => ({ kind: "post" as const, slug: i.slug, title: i.title, date: i.date })),
    ...moments.listRuntime(lang).map((i) => ({ kind: "moment" as const, slug: i.slug, title: i.title, date: i.date })),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  // 仓库收录的内容只读。删掉它下一次 `git reset --hard` 会复活；编辑它
  // 下一次部署会被静默回滚——"我改了但它变回去了"比不提供功能更糟。
  const repoEntries = posts.getItems(lang);

  const errorText =
    error === "empty" ? t.admin.errEmpty
    : error === "slug" ? t.admin.errSlug
    : error === "notfound" ? t.admin.errNotFound
    : null;

  return (
    <Container className="max-w-2xl py-16">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">
            {t.admin.title}
          </h1>
          <p className="mt-2 text-sm text-fg-muted">{t.admin.subtitle}</p>
        </div>
        <form action={logoutAction}>
          <input type="hidden" name="lang" value={lang} />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {t.admin.signOut}
          </button>
        </form>
      </header>

      {ok && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-2.5 text-sm text-fg"
        >
          {t.admin.saved} <span className="font-mono text-xs">{ok}</span>
        </p>
      )}
      {errorText && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-red-500/40 px-4 py-2.5 text-sm text-red-600 dark:text-red-400"
        >
          {errorText}
        </p>
      )}

      <Editor
        lang={lang}
        initial={initial}
        labels={{
          kindPost: t.admin.kindPost,
          kindMoment: t.admin.kindMoment,
          fieldTitle: t.admin.fieldTitle,
          fieldTags: t.admin.fieldTags,
          fieldBody: t.admin.fieldBody,
          fieldBodyMoment: t.admin.fieldBodyMoment,
          publish: t.admin.publish,
          save: t.admin.save,
          cancel: t.admin.cancel,
          tagsHint: t.admin.tagsHint,
        }}
      />

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          {t.admin.published}
        </h2>
        {runtimeEntries.length === 0 ? (
          <p className="text-sm text-fg-subtle">{t.admin.empty}</p>
        ) : (
          <RuntimeList
            lang={lang}
            entries={runtimeEntries}
            labels={{
              edit: t.admin.edit,
              remove: t.admin.remove,
              confirmRemove: t.admin.confirmRemove,
              kindPost: t.admin.kindPost,
              kindMoment: t.admin.kindMoment,
            }}
          />
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          {t.admin.repoManaged}
        </h2>
        <p className="mb-4 text-xs text-fg-subtle">{t.admin.repoManagedHint}</p>
        <ul className="flex flex-col gap-1">
          {repoEntries.map((e) => (
            <li
              key={e.slug}
              className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-fg-muted">
                {e.title}
              </span>
              <span className="shrink-0 font-mono text-xs text-fg-subtle">
                {e.date}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Container>
  );
}

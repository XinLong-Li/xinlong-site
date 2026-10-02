import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Container from "@/components/Container";
import { SESSION_COOKIE, isValidSessionToken, remainingLockoutMinutes } from "@/lib/auth";
import { moments, posts } from "@/lib/content";
import { getDictionary, isLang, type Lang } from "@/lib/i18n";
import AdminPanel, { type ServerPost } from "./AdminPanel";
import LoginForm from "./LoginForm";

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
  robots: { index: false, follow: false },
};

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const { error } = await searchParams;

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

  /*
   * 这里给客户端的是「服务器视图」—— 也就是这台机器上 git 副本的内容，
   * 外加还没进 git 的遗留草稿。它**只在部署时更新**，所以刚提交的文章
   * 不会出现在这里。
   *
   * 客户端挂载后还会自己从 GitHub 拉一份实时列表，两边合并后才是完整的。
   * 只靠这一份的话，用户提交完会看到文章"消失"，像是丢了数据。
   */
  const collect = (
    kind: "post" | "moment",
    items: ReturnType<typeof posts.getItems>,
    isInGit: (l: Lang, slug: string) => boolean,
  ): ServerPost[] =>
    items.map((i) => ({
      slug: i.slug,
      title: i.title,
      date: i.date,
      kind,
      // deployed = 在服务器 git 副本里（即"已上线"）；否则是遗留的服务器草稿
      deployed: isInGit(lang, i.slug),
    }));

  const serverPosts: ServerPost[] = [
    ...collect("post", posts.getItems(lang), posts.isInGit),
    ...collect("moment", moments.getItems(lang), moments.isInGit),
  ].sort((a, b) => (a.date > b.date ? -1 : 1));

  return (
    <Container className="max-w-2xl py-16">
      <AdminPanel
        lang={lang}
        serverPosts={serverPosts}
        labels={{
          title: t.admin.title,
          subtitle: t.admin.subtitle,
          signOut: t.admin.signOut,
          kindPost: t.admin.kindPost,
          kindMoment: t.admin.kindMoment,
          fieldTitle: t.admin.fieldTitle,
          fieldTags: t.admin.fieldTags,
          fieldBody: t.admin.fieldBody,
          fieldBodyMoment: t.admin.fieldBodyMoment,
          publish: t.admin.publish,
          save: t.admin.save,
          cancel: t.admin.cancel,
          edit: t.admin.edit,
          remove: t.admin.remove,
          confirmRemove: t.admin.confirmRemove,
          saved: t.admin.saved,
          empty: t.admin.empty,
          tagsHint: t.admin.tagsHint,
          errEmpty: t.admin.errEmpty,
          errNotFound: t.admin.errNotFound,
          stateLive: t.admin.stateLive,
          statePending: t.admin.statePending,
          stateDraft: t.admin.stateDraft,
          statePendingDelete: t.admin.statePendingDelete,
          tokenMissing: t.admin.tokenMissing,
          loading: t.admin.loading,
          publishedHint: t.admin.publishedHint,
          viewCommit: t.admin.viewCommit,
          allPosts: t.admin.allPosts,
        }}
      />
    </Container>
  );
}

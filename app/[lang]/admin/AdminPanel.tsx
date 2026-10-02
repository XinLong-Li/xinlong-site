"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  commitUrl,
  deleteFile,
  listFiles,
  readFile,
  writeFile,
  type RepoFile,
} from "@/lib/github-client";
import type { RepoRef } from "@/lib/github";
import {
  assertValidFrontmatter,
  plainText,
  serializeFrontmatter,
  splitFrontmatter,
} from "@/lib/frontmatter";
import { isSafeSlug, slugify, todayStamp, uniqueSlug } from "@/lib/slug";
import type { Lang } from "@/lib/i18n";
import { getRepoRefAction, logoutAction, readRuntimeDraftAction } from "./actions";
import Editor, { type EditorValues } from "./Editor";
import PostList from "./PostList";

export type ServerPost = {
  slug: string;
  title: string;
  date: string;
  kind: "post" | "moment";
  /** true = 在服务器 git 副本里（已上线）；false = 遗留的服务器草稿 */
  deployed: boolean;
};

export type PostState = "live" | "pending" | "draft" | "pendingDelete";

export type MergedPost = ServerPost & { state: PostState; sha?: string };

type Labels = Record<
  | "title"
  | "subtitle"
  | "signOut"
  | "kindPost"
  | "kindMoment"
  | "fieldTitle"
  | "fieldTags"
  | "fieldBody"
  | "fieldBodyMoment"
  | "publish"
  | "save"
  | "cancel"
  | "edit"
  | "remove"
  | "confirmRemove"
  | "saved"
  | "empty"
  | "tagsHint"
  | "errEmpty"
  | "errNotFound"
  | "stateLive"
  | "statePending"
  | "stateDraft"
  | "statePendingDelete"
  | "tokenMissing"
  | "loading"
  | "publishedHint"
  | "viewCommit"
  | "allPosts",
  string
>;

/** slug 决定文件名，而文件名会拼进 GitHub 的 API 路径 —— 只允许安全字符。 */
function pathFor(kind: "post" | "moment", lang: Lang, slug: string): string {
  const dir = kind === "post" ? "posts" : "moments";
  return `content/${dir}/${lang}/${slug}.md`;
}

export default function AdminPanel({
  lang,
  serverPosts,
  labels,
}: {
  lang: Lang;
  serverPosts: ServerPost[];
  labels: Labels;
}) {
  const [repoRef, setRepoRef] = useState<RepoRef | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [gitFiles, setGitFiles] = useState<Map<string, RepoFile> | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{
    kind: "post" | "moment";
    slug: string;
    title: string;
    tags: string;
    body: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<
    { kind: "ok" | "err"; text: string; sha?: string } | null
  >(null);

  /* -------------------------------------------------- 取 token + 拉实时列表 */

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getRepoRefAction();
      if (cancelled) return;

      if (!result.ok) {
        setTokenError(result.error);
        return;
      }
      const ref = result.ref;
      setRepoRef(ref);

      try {
        const [posts, moments] = await Promise.all([
          listFiles(ref, `content/posts/${lang}`),
          listFiles(ref, `content/moments/${lang}`),
        ]);
        if (cancelled) return;
        const map = new Map<string, RepoFile>();
        for (const f of [...posts, ...moments]) {
          map.set(f.name.replace(/\.md$/, ""), f);
        }
        setGitFiles(map);
      } catch (e) {
        if (!cancelled) {
          setListError(e instanceof Error ? e.message : String(e));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  /* ------------------------------------------------------------ 合并列表 */

  const merged: MergedPost[] = useMemo(() => {
    if (!gitFiles) return serverPosts.map((p) => ({ ...p, state: stateOf(p, false) }));

    const seen = new Set<string>();
    const out: MergedPost[] = [];

    for (const p of serverPosts) {
      const key = `${p.kind}:${p.slug}`;
      seen.add(key);
      const file = gitFiles.get(p.slug);
      out.push({
        ...p,
        state: stateOf(p, Boolean(file)),
        sha: file?.sha,
      });
    }

    // 只在 GitHub 上、服务器还没拉到的 —— 刚提交的
    for (const [slug, file] of gitFiles) {
      const isMoment = file.path.includes("/moments/");
      const kind = isMoment ? ("moment" as const) : ("post" as const);
      if (seen.has(`${kind}:${slug}`)) continue;
      out.push({
        slug,
        title: slug,
        date: "",
        kind,
        deployed: false,
        state: "pending",
        sha: file.sha,
      });
    }

    return out.sort((a, b) => (a.date > b.date ? -1 : 1));
  }, [serverPosts, gitFiles]);

  function stateOf(p: ServerPost, inGit: boolean): PostState {
    if (p.deployed && inGit) return "live";
    if (p.deployed && !inGit) return "pendingDelete";
    if (!p.deployed && inGit) return "pending";
    return "draft";
  }

  /* -------------------------------------------------------------- 写入 */

  const run = useCallback(
    async (fn: () => Promise<{ sha?: string; ok: string }>) => {
      setBusy(true);
      setNotice(null);
      try {
        const r = await fn();
        // 提交成功后重新拉一次列表，让"待部署"立刻出现
        if (repoRef) {
          const [posts, moments] = await Promise.all([
            listFiles(repoRef, `content/posts/${lang}`),
            listFiles(repoRef, `content/moments/${lang}`),
          ]);
          const map = new Map<string, RepoFile>();
          for (const f of [...posts, ...moments]) {
            map.set(f.name.replace(/\.md$/, ""), f);
          }
          setGitFiles(map);
        }
        setNotice({ kind: "ok", text: r.ok, sha: r.sha });
        return true;
      } catch (e) {
        // GitHub 的错误原文在这里原样显示 —— 401/409/422 的原因很具体，
        // 包装成"保存失败"等于把排查线索扔掉。
        setNotice({ kind: "err", text: e instanceof Error ? e.message : String(e) });
        return false;
      } finally {
        setBusy(false);
      }
    },
    [repoRef, lang],
  );

  const handleSubmit = async (values: EditorValues) => {
    if (!repoRef) return;

    const isMoment = values.kind === "moment";
    const date = editing
      ? (merged.find((m) => m.slug === editing.slug)?.date || todayStamp())
      : todayStamp();

    if (!values.body.trim()) {
      setNotice({ kind: "err", text: labels.errEmpty });
      return;
    }
    if (!isMoment && !values.title.trim()) {
      setNotice({ kind: "err", text: labels.errEmpty });
      return;
    }

    // 编辑时 slug 不变 —— 它是对外 URL 的一部分
    let slug: string;
    let title: string;
    let tags: string[];
    let summary: string;

    if (isMoment) {
      const flat = plainText(values.body);
      title = flat.slice(0, 40) || `moment-${date}`;
      summary = flat.slice(0, 80);
      tags = [];
      slug = editing?.slug ?? "";
    } else {
      title = values.title.trim();
      summary = "";
      tags = values.tags
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12);
      slug = editing?.slug ?? "";
    }

    if (!editing) {
      // 新建：要避开 git 上和服务器上已有的 slug
      const taken = [
        ...(gitFiles?.keys() ?? []),
        ...serverPosts.map((p) => p.slug),
      ];
      slug = uniqueSlug(taken, slugify(isMoment ? title : values.title.trim(), date));
      if (!isSafeSlug(slug)) {
        setNotice({ kind: "err", text: "生成的 slug 不合法" });
        return;
      }
    }

    if (!isSafeSlug(slug)) {
      setNotice({ kind: "err", text: "slug 不合法" });
      return;
    }

    const path = pathFor(values.kind, lang, slug);
    const frontmatter = { title, date, tags, summary, lang };
    try {
      // 写成合法 YAML 还不够，形状也得对 —— 否则下一篇部署会在
      // generateStaticParams 里炸，而那时没人会联想到是今天写的这篇。
      assertValidFrontmatter(frontmatter);
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : String(e) });
      return;
    }
    const content = serializeFrontmatter(frontmatter, values.body);
    const sha = editing ? gitFiles?.get(slug)?.sha : undefined;

    const ok = await run(async () => {
      const { commitSha } = await writeFile(
        repoRef,
        path,
        content,
        editing ? `content: 更新 ${slug}` : `content: 发布 ${slug}`,
        sha,
      );
      return { sha: commitSha, ok: `${labels.publishedHint}` };
    });

    if (ok) setEditing(null);
  };

  const handleDelete = async (post: MergedPost) => {
    if (!repoRef) return;
    const sha = post.sha ?? gitFiles?.get(post.slug)?.sha;
    if (!sha) {
      setNotice({
        kind: "err",
        text: "这篇只在服务器上（遗留草稿），需要先保存一次把它提交到仓库才能删除。",
      });
      return;
    }
    await run(async () => {
      const { commitSha } = await deleteFile(
        repoRef,
        pathFor(post.kind, lang, post.slug),
        sha,
        `content: 删除 ${post.slug}`,
      );
      return { sha: commitSha, ok: labels.publishedHint };
    });
  };

  const handleEdit = async (post: MergedPost) => {
    if (!repoRef) return;
    setNotice(null);
    setBusy(true);
    try {
      const path = pathFor(post.kind, lang, post.slug);
      const file = await readFile(repoRef, path);

      // 不在仓库里 = 服务器上的遗留草稿（那套运行时写入机制拆掉了，
      // 但服务器磁盘上还有内容）。回退到服务端读它，编辑后保存就会提交到
      // git，这篇随之升级成正式内容。
      const raw =
        file?.content ??
        (await readRuntimeDraftAction(lang, post.kind, post.slug));

      if (!raw) {
        setNotice({ kind: "err", text: labels.errNotFound });
        return;
      }
      const { data, content } = splitFrontmatter(raw);
      setEditing({
        kind: post.kind,
        slug: post.slug,
        title: String(data.title ?? post.title),
        tags: Array.isArray(data.tags) ? (data.tags as string[]).join(", ") : "",
        body: content.trim(),
      });
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------- 渲染 */

  const disabled = !repoRef || busy;

  return (
    <>
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">{labels.title}</h1>
          <p className="mt-2 text-sm text-fg-muted">{labels.subtitle}</p>
        </div>
        <form action={logoutAction}>
          <input type="hidden" name="lang" value={lang} />
          <button
            type="submit"
            className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
          >
            {labels.signOut}
          </button>
        </form>
      </header>

      {tokenError && (
        <p role="alert" className="mb-5 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {labels.tokenMissing}
          <span className="mt-1 block font-mono text-xs opacity-80">{tokenError}</span>
        </p>
      )}

      {!gitFiles && !tokenError && (
        <p className="mb-5 text-sm text-fg-subtle">{labels.loading}</p>
      )}

      {listError && (
        <p role="alert" className="mb-5 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {listError}
        </p>
      )}

      {notice && (
        <p
          role={notice.kind === "err" ? "alert" : "status"}
          className={
            notice.kind === "err"
              ? "mb-5 rounded-xl border border-red-500/40 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              : "mb-5 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm text-fg"
          }
        >
          {notice.text}
          {notice.sha && repoRef && (
            <a
              href={commitUrl(repoRef, notice.sha)}
              target="_blank"
              rel="noreferrer"
              className="ml-2 underline underline-offset-4"
            >
              {labels.viewCommit}
            </a>
          )}
        </p>
      )}

      <Editor
        lang={lang}
        labels={labels}
        initial={editing ?? undefined}
        disabled={disabled}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      <section className="mt-12">
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-fg-muted uppercase">
          {labels.allPosts}
        </h2>
        {merged.length === 0 ? (
          <p className="text-sm text-fg-subtle">{labels.empty}</p>
        ) : (
          <PostList
            posts={merged}
            labels={labels}
            busy={busy}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>
    </>
  );
}

/* 序列化 / 解析 / 校验都在 lib/frontmatter.ts —— 服务端和这里共用同一份，
   否则"什么算一篇合法文章"的规则迟早会漂移成两套。 */

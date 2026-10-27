"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
import { writeAdminHint } from "@/lib/admin-hint";
import { prepareImage } from "@/lib/image-upload";
import type { Lang } from "@/lib/i18n";
import { getRepoRefAction, logoutAction, readRuntimeDraftAction } from "./actions";
import Editor, { type EditorValues } from "./Editor";
import {
  dropDraft,
  getDraft,
  keyFor,
  latestDraft,
  saveDraft,
  type DraftTarget,
} from "./drafts";
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
  | "allPosts"
  | "draftRestored"
  | "discardDraft"
  | "insertImage"
  | "uploading"
  | "uploadFailed",
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

  /* --------------------------------------------------- 本地草稿的界面状态 */

  const [draftReady, setDraftReady] = useState(false);
  /** 恢复出来的"新建"草稿；null 表示新建框是空的。 */
  const [composer, setComposer] = useState<EditorValues | null>(null);
  /** 发布成功后靠它重建非受控表单，否则已发布的内容还留在框里。 */
  const [composerRev, setComposerRev] = useState(0);
  /** 当前这一份内容是不是从草稿恢复的（决定要不要显示提示条）。 */
  const [restoredKey, setRestoredKey] = useState<string | null>(null);
  /** 防抖中的待写草稿。目标在输入时就固定，避免切文章后写错 key。 */
  const pendingRef = useRef<{
    lang: Lang;
    target: DraftTarget;
    values: EditorValues;
    timer: number;
  } | null>(null);

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

  /* ------------------------------------------------ 本地草稿：恢复与自动保存 */

  // 服务端确认过会话有效才会渲染到这里 —— 记下"这个浏览器登录过"，
  // 导航栏据此决定要不要显示后台入口。
  useEffect(() => {
    writeAdminHint(true);
  }, []);

  /**
   * 恢复放在 effect 里而不是渲染期：这个组件会被 SSR，渲染时读 localStorage 会造成
   * hydration 不一致。
   *
   * `draftReady` 之前不渲染编辑器：输入框是非受控的，`defaultValue` 只在挂载时
   * 生效；恢复"新建"草稿时 `editing` 仍是 null、`<Editor key>` 也不会变，
   * 不挡住第一次渲染的话恢复出来的内容永远进不去。
   */
  useEffect(() => {
    const found = latestDraft(lang);
    if (found) {
      if (found.target.scope === "edit") {
        setEditing({
          kind: found.target.kind,
          slug: found.target.slug,
          title: found.draft.title,
          tags: found.draft.tags,
          body: found.draft.body,
        });
      } else {
        setComposer({
          kind: found.draft.kind,
          title: found.draft.title,
          tags: found.draft.tags,
          body: found.draft.body,
        });
      }
      setRestoredKey(found.key);
    }
    setDraftReady(true);
  }, [lang]);

  const flushDraft = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timer);
    pendingRef.current = null;
    saveDraft(pending.lang, pending.target, pending.values);
  }, []);

  const cancelPending = useCallback(() => {
    if (pendingRef.current) window.clearTimeout(pendingRef.current.timer);
    pendingRef.current = null;
  }, []);

  /**
   * 输入 → 500ms 防抖落盘。草稿目标在**输入时**就固定下来：否则 500ms 内切了
   * 文章，回调会把上一篇的内容写到新文章的 key 上。
   */
  const handleDraftChange = useCallback(
    (values: EditorValues) => {
      const target: DraftTarget = editing
        ? { scope: "edit", kind: editing.kind, slug: editing.slug }
        : { scope: "new" };

      const pending = pendingRef.current;
      if (pending && keyFor(pending.target) !== keyFor(target)) {
        flushDraft();
      }
      if (pendingRef.current) window.clearTimeout(pendingRef.current.timer);

      const timer = window.setTimeout(() => flushDraft(), 500);
      pendingRef.current = { lang, target, values, timer };
    },
    [editing, lang, flushDraft],
  );

  /**
   * 防抖还没到点就离开时（点导航、切标签页、关页面、客户端导航卸载），
   * 把最后一笔落盘。StrictMode 下挂载后会立刻清理一次，此时 pendingRef
   * 是 null，flush 是空操作，不会误存。
   */
  useEffect(() => {
    const onPageHide = () => flushDraft();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushDraft();
    };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      flushDraft();
    };
  }, [flushDraft]);

  const handleDiscard = useCallback(() => {
    cancelPending();
    if (editing) {
      dropDraft(lang, {
        scope: "edit",
        kind: editing.kind,
        slug: editing.slug,
      });
      setEditing(null);
    } else {
      dropDraft(lang, { scope: "new" });
      setComposer(null);
      setComposerRev((rev) => rev + 1);
    }
    setRestoredKey(null);
  }, [cancelPending, editing, lang]);

  /** 取消 = 明确放弃这篇的修改（用户确认过的语义）。 */
  const handleCancel = useCallback(() => {
    cancelPending();
    if (editing) {
      dropDraft(lang, {
        scope: "edit",
        kind: editing.kind,
        slug: editing.slug,
      });
    }
    setEditing(null);
    setRestoredKey(null);
  }, [cancelPending, editing, lang]);

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

    // 先把待写的草稿落盘：否则成功删除草稿后，残留的防抖计时器又会写回来。
    flushDraft();
    const draftTarget: DraftTarget = editing
      ? { scope: "edit", kind: editing.kind, slug: editing.slug }
      : { scope: "new" };

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

    if (ok) {
      cancelPending();
      dropDraft(lang, draftTarget);
      setRestoredKey(null);
      if (editing) {
        setEditing(null);
      } else {
        // 非受控表单不会自己清空：不换 key 的话已发布的内容会留在框里，
        // 下一次输入又会为它生成一份草稿。
        setComposer(null);
        setComposerRev((rev) => rev + 1);
      }
    }
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
    const ok = await run(async () => {
      const { commitSha } = await deleteFile(
        repoRef,
        pathFor(post.kind, lang, post.slug),
        sha,
        `content: 删除 ${post.slug}`,
      );
      return { sha: commitSha, ok: labels.publishedHint };
    });

    if (ok) {
      cancelPending();
      // 文章都删了，它的草稿留着只会让下次恢复出一篇已经不存在的文章。
      dropDraft(lang, { scope: "edit", kind: post.kind, slug: post.slug });
      if (editing?.kind === post.kind && editing?.slug === post.slug) {
        setEditing(null);
        setRestoredKey(null);
      }
    }
  };

  /* -------------------------------------------------------------- 图片上传 */

  /**
   * 压缩 → 提交到 public/images/<年-月>/ → 返回站内路径。
   *
   * 走的是和正文完全相同的 Contents API，所以图片和文字一样版本化、可回滚。
   * 每次上传是一次独立提交，会触发一次部署 —— 和保存正文同一个节奏。
   */
  const handleUploadImage = useCallback(
    async (file: File): Promise<string> => {
      if (!repoRef) throw new Error("not ready");

      const { bytes, ext } = await prepareImage(file);
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      // 随机名而不是原文件名：避开中文、空格与重名，URL 也稳定可缓存。
      const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;

      await writeFile(
        repoRef,
        `public/images/${month}/${name}`,
        bytes,
        `content: 上传图片 ${name}`,
      );

      return `/images/${month}/${name}`;
    },
    [repoRef],
  );

  const handleEdit = async (post: MergedPost) => {
    if (!repoRef) return;

    // 上一个目标还没落盘的输入先存掉，再切换目标。
    flushDraft();
    setNotice(null);

    const target: DraftTarget = {
      scope: "edit",
      kind: post.kind,
      slug: post.slug,
    };
    const draft = getDraft(lang, target);
    if (draft) {
      // 这篇有未保存的草稿：优先恢复它，不去拉 GitHub 上的旧正文。
      setEditing({
        kind: post.kind,
        slug: post.slug,
        title: draft.title,
        tags: draft.tags,
        body: draft.body,
      });
      setRestoredKey(keyFor(target));
      return;
    }
    setRestoredKey(null);

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

  // 编辑已有文章时要等 gitFiles 到齐：保存需要它里面的 sha，否则 GitHub 会以 422
  // 拒绝"创建"一个已经存在的文件。恢复草稿跳过了 handleEdit 的读取，这个空窗
  // 比以前更容易被踩到。
  const disabled = !repoRef || busy || (editing !== null && gitFiles === null);

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

      {draftReady && (
        <>
          {restoredKey && (
            <div
              role="status"
              className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent-soft/40 px-4 py-3 text-sm text-fg"
            >
              <span>{labels.draftRestored}</span>
              <button
                type="button"
                onClick={handleDiscard}
                className="shrink-0 text-xs font-medium text-accent underline underline-offset-4 transition-colors hover:text-accent-strong"
              >
                {labels.discardDraft}
              </button>
            </div>
          )}

          {/* 按目标重建：非受控字段只在挂载时读 defaultValue，换一篇/换一个
              新建框都必须换 key。发布成功后 composerRev 变化，框会清空。 */}
          <Editor
            key={editing ? `edit:${editing.slug}` : `new:${composerRev}`}
            lang={lang}
            labels={labels}
            initial={editing ?? undefined}
            defaults={editing ? undefined : composer ?? undefined}
            disabled={disabled}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onDraftChange={handleDraftChange}
            onUploadImage={handleUploadImage}
          />
        </>
      )}

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

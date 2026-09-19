import Link from "next/link";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Prose from "@/components/Prose";
import Tag from "@/components/Tag";
import { posts } from "@/lib/content";
import { getDictionary, isLang, LANGS } from "@/lib/i18n";

export const revalidate = 60;

export function generateStaticParams() {
  // 嵌套动态路由必须同时返回两个段。只返回 { slug } 会让构建成功但
  // 静默丢弃预渲染页面，两语言都会漏。
  return LANGS.flatMap((lang) =>
    posts.getSlugs(lang).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const post = await posts.getDetail(lang, slug);
  if (!post) return {};
  return { title: post.title, description: post.summary };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const post = await posts.getDetail(lang, slug);
  if (!post) notFound();

  const t = getDictionary(lang);

  return (
    <Container className="py-16">
      {/* 博客详情此前既没有 container（正文撑满视口宽度），也没有返回链接 */}
      <article className="mx-auto max-w-3xl">
        <Link
          href={`/${lang}/blog`}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {t.common.backToBlog}
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <time className="font-mono text-sm text-fg-subtle">
            {post.date}
          </time>
          {!!post.tags?.length && (
            <ul className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag}>
                  <Tag>#{tag}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>

        {post.summary && (
          <p className="mt-6 border-l-2 border-accent pl-4 leading-relaxed text-fg-muted">
            {post.summary}
          </p>
        )}

        <Prose html={post.contentHtml} className="mt-8" />
      </article>
    </Container>
  );
}

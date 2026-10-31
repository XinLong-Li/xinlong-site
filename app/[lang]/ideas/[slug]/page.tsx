import Link from "next/link";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Prose from "@/components/Prose";
import Tag from "@/components/Tag";
import { ideas } from "@/lib/content";
import { getDictionary, isLang, LANGS } from "@/lib/i18n";

export const revalidate = 60;

export function generateStaticParams() {
  // 两个段都要返回，否则构建成功但预渲染页面被静默丢弃。
  return LANGS.flatMap((lang) =>
    ideas.getSlugs(lang).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const idea = await ideas.getDetail(lang, slug);
  if (!idea) return {};
  return { title: idea.title, description: idea.summary };
}

export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const idea = await ideas.getDetail(lang, slug);
  if (!idea) notFound();

  const t = getDictionary(lang);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-3xl">
        <Link
          href={`/${lang}/ideas`}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {t.common.backToIdeas}
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {idea.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <time className="font-mono text-sm text-fg-subtle">{idea.date}</time>
          {!!idea.tags?.length && (
            <ul className="flex flex-wrap gap-2">
              {idea.tags.map((tag) => (
                <li key={tag}>
                  <Tag>#{tag}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>

        {idea.summary && (
          <p className="mt-6 border-l-2 border-accent pl-4 leading-relaxed text-fg-muted">
            {idea.summary}
          </p>
        )}

        <Prose html={idea.contentHtml} className="mt-8" />
      </article>
    </Container>
  );
}

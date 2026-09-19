import Link from "next/link";
import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Prose from "@/components/Prose";
import Tag from "@/components/Tag";
import { projects } from "@/lib/content";
import { getDictionary, isLang, LANGS } from "@/lib/i18n";

export const revalidate = 60;

export function generateStaticParams() {
  // 两个段都要返回，否则构建成功但预渲染页面被静默丢弃。
  return LANGS.flatMap((lang) =>
    projects.getSlugs(lang).map((slug) => ({ lang, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const project = await projects.getDetail(lang, slug);
  if (!project) return {};
  return { title: project.title, description: project.summary };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();

  const project = await projects.getDetail(lang, slug);
  if (!project) notFound();

  const t = getDictionary(lang);

  return (
    <Container className="py-16">
      <article className="mx-auto max-w-3xl">
        <Link
          href={`/${lang}/projects`}
          className="text-sm font-medium text-accent transition-colors hover:text-accent-strong"
        >
          {t.common.backToProjects}
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          {project.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <time className="font-mono text-sm text-fg-subtle">
            {project.date}
          </time>
          {!!project.tags?.length && (
            <ul className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Tag>#{tag}</Tag>
                </li>
              ))}
            </ul>
          )}
        </div>

        {project.summary && (
          <p className="mt-6 border-l-2 border-accent pl-4 leading-relaxed text-fg-muted">
            {project.summary}
          </p>
        )}

        <Prose html={project.contentHtml} className="mt-8" />
      </article>
    </Container>
  );
}

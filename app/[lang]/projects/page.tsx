import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Tag from "@/components/Tag";
import { projects } from "@/lib/content";
import { getDictionary, isLang } from "@/lib/i18n";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.projects.title, description: t.projects.subtitle };
}

export default async function ProjectsListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const all = projects.getItems(lang);

  return (
    <Container className="py-16">
      <PageHeader title={t.projects.title} subtitle={t.projects.subtitle} />

      {all.length === 0 ? (
        <p className="text-fg-subtle">{t.common.emptyProjects}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {all.map((project) => (
            <Card key={project.slug} href={`/${lang}/projects/${project.slug}`}>
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                {project.title}
              </h2>
              <p className="mt-1 font-mono text-sm text-fg-subtle">
                {project.date}
              </p>
              {project.summary && (
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {project.summary}
                </p>
              )}
              {!!project.tags?.length && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <li key={tag}>
                      <Tag>#{tag}</Tag>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Tag from "@/components/Tag";
import { ideas } from "@/lib/content";
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
  return { title: t.ideas.title, description: t.ideas.subtitle };
}

export default async function IdeasListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const all = ideas.getItems(lang);

  return (
    <Container className="py-16">
      <PageHeader title={t.ideas.title} subtitle={t.ideas.subtitle} />

      {all.length === 0 ? (
        <p className="text-fg-subtle">{t.common.emptyIdeas}</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {all.map((idea) => (
            <Card key={idea.slug} href={`/${lang}/ideas/${idea.slug}`}>
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                {idea.title}
              </h2>
              <p className="mt-1 font-mono text-sm text-fg-subtle">
                {idea.date}
              </p>
              {idea.summary && (
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {idea.summary}
                </p>
              )}
              {!!idea.tags?.length && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
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

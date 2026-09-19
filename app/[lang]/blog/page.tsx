import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Tag from "@/components/Tag";
import { posts } from "@/lib/content";
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
  return { title: t.blog.title, description: t.blog.subtitle };
}

export default async function BlogListPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const all = posts.getItems(lang);

  return (
    <Container className="py-16">
      <PageHeader title={t.blog.title} subtitle={t.blog.subtitle} />

      {all.length === 0 ? (
        <p className="text-fg-subtle">{t.common.emptyPosts}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {all.map((post) => (
            <Card key={post.slug} href={`/${lang}/blog/${post.slug}`}>
              <h2 className="text-xl font-semibold tracking-tight text-fg">
                {post.title}
              </h2>
              <p className="mt-1 font-mono text-sm text-fg-subtle">
                {post.date}
              </p>
              {post.summary && (
                <p className="mt-3 leading-relaxed text-fg-muted">
                  {post.summary}
                </p>
              )}
              {!!post.tags?.length && (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
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

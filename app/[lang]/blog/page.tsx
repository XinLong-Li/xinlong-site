import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Prose from "@/components/Prose";
import Tag from "@/components/Tag";
import WritingFilter from "@/components/WritingFilter";
import {
  ideas,
  moments,
  posts,
  type ContentDetail,
  type ContentItem,
} from "@/lib/content";
import { getDictionary, isLang } from "@/lib/i18n";

export const revalidate = 60;

/**
 * 统一流里的一项。
 *
 * 文章和点子有详情页，列表里只需要元数据；瞬间没有详情页，正文直接内联。
 * 用 kind 做判别，渲染时就按类型走不同分支。
 */
type FeedItem =
  | ({ kind: "post" | "idea" } & ContentItem)
  | ({ kind: "moment" } & ContentDetail);

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

  // 博客是统一入口：文章、瞬间、点子按日期混排。
  // 旧的 /moments 与 /ideas 仍然保留，作为可直接访问的归档页。
  const items: FeedItem[] = [
    ...posts.getItems(lang).map((item) => ({ kind: "post" as const, ...item })),
    ...ideas.getItems(lang).map((item) => ({ kind: "idea" as const, ...item })),
    ...(await moments.getItemsWithHtml(lang)).map((item) => ({
      kind: "moment" as const,
      ...item,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const counts = {
    all: items.length,
    post: items.filter((item) => item.kind === "post").length,
    moment: items.filter((item) => item.kind === "moment").length,
    idea: items.filter((item) => item.kind === "idea").length,
  };

  return (
    <Container className="py-16">
      <PageHeader title={t.blog.title} subtitle={t.blog.subtitle} />

      {items.length === 0 ? (
        <p className="text-fg-subtle">{t.common.emptyPosts}</p>
      ) : (
        <WritingFilter
          labels={t.kinds}
          counts={counts}
          groupLabel={lang === "zh" ? "按类型筛选" : "Filter by type"}
        >
          <div className="flex flex-col gap-4">
            {items.map((item) => (
              <div key={`${item.kind}:${item.slug}`} data-kind={item.kind}>
                {item.kind === "moment" ? (
                  <Card>
                    <FeedMeta label={t.kinds.moment} date={item.date} />
                    <Prose
                      html={item.contentHtml}
                      className="moments-prose mt-2 text-sm"
                    />
                  </Card>
                ) : (
                  <Card
                    href={`/${lang}/${item.kind === "post" ? "blog" : "ideas"}/${item.slug}`}
                  >
                    <FeedMeta label={t.kinds[item.kind]} date={item.date} />
                    <h2 className="mt-2 text-xl font-semibold tracking-tight text-fg">
                      {item.title}
                    </h2>
                    {item.summary && (
                      <p className="mt-3 leading-relaxed text-fg-muted">
                        {item.summary}
                      </p>
                    )}
                    {!!item.tags?.length && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <li key={tag}>
                            <Tag>#{tag}</Tag>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )}
              </div>
            ))}
          </div>
        </WritingFilter>
      )}
    </Container>
  );
}

/** 每张卡片顶部的类型徽章 + 日期。 */
function FeedMeta({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Tag>{label}</Tag>
      <time className="font-mono text-xs text-fg-subtle">{date}</time>
    </div>
  );
}

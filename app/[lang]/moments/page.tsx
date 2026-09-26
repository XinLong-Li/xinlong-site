import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import Prose from "@/components/Prose";
import { moments } from "@/lib/content";
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
  return { title: t.moments.title, description: t.moments.subtitle };
}

export default async function MomentsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  // 用批量版本而不是逐条 getDetail：后者会跑 N 次完整的 markdown 解析。
  const all = await moments.getItemsWithHtml(lang);

  return (
    <Container className="py-16">
      <PageHeader title={t.moments.title} subtitle={t.moments.subtitle} />

      {all.length === 0 ? (
        <p className="text-fg-subtle">{t.moments.empty}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {all.map((m) => (
            // 随笔不做详情页：短文本不需要独立 URL，而且多一条详情路由就多一条
            // 需要在编辑时 revalidate 的路径，收益接近零。
            <Card key={m.slug}>
              <time className="font-mono text-xs text-fg-subtle">{m.date}</time>
              <Prose html={m.contentHtml} className="mt-2 text-sm" />
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}

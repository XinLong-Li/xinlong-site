import { notFound } from "next/navigation";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { getDictionary, isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.resume.title, description: t.resume.subtitle };
}

export default async function ResumePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);

  return (
    <Container className="py-16">
      <PageHeader title={t.resume.title} subtitle={t.resume.subtitle} />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-fg">
            {t.resume.experience}
          </h2>
          <ol className="flex flex-col gap-5">
            {t.resume.entries.map((entry) => (
              <li
                key={`${entry.period}-${entry.org}`}
                className="flex flex-col gap-1 border-l-2 border-border pl-4 sm:grid sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4"
              >
                <span className="font-mono text-sm text-fg-subtle">
                  {entry.period}
                </span>
                <span>
                  <span className="font-semibold text-fg">{entry.role}</span>
                  <span className="block text-fg-muted">
                    {entry.org}
                    {entry.dept ? ` · ${entry.dept}` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>

        {/*
          这里原本是 "公司/团队 · 负责方向 · 关键成果/指标" 之类的占位文案，
          以及一份写着 React / Next.js / Node.js 的技能栏——对一个嵌入式
          岗位而言完全是模板残留，已删除。

          工作成果要点应由本人从真实经历补充。此处刻意留空而非填入听起来
          合理的编造内容。
        */}

        <Card>
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-fg">
            {t.resume.skills}
          </h2>
          <dl className="flex flex-col gap-4">
            {t.resume.skillGroups.map((group) => (
              <div
                key={group.label}
                className="flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:gap-4"
              >
                <dt className="text-sm font-medium text-fg-subtle">
                  {group.label}
                </dt>
                <dd className="text-fg-muted">{group.items}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Container>
  );
}

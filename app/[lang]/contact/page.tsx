import { notFound } from "next/navigation";
import { Github, Linkedin, Mail } from "lucide-react";

import Container from "@/components/Container";
import Card from "@/components/Card";
import PageHeader from "@/components/PageHeader";
import { CONTACT_LINKS, getDictionary, isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.contact.title, description: t.contact.subtitle };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);

  // 旧实现是 <p><strong>Email:</strong> <a/></p> 三行，语义上是标签+值的
  // 配对，用 dl 更准确。
  const rows = [
    {
      key: "email",
      icon: Mail,
      label: t.contact.emailLabel,
      value: t.contact.email,
      href: CONTACT_LINKS.email,
      external: false,
    },
    {
      key: "github",
      icon: Github,
      label: t.contact.githubLabel,
      value: t.contact.github,
      href: CONTACT_LINKS.github,
      external: true,
    },
    {
      key: "linkedin",
      icon: Linkedin,
      label: t.contact.linkedinLabel,
      value: t.contact.linkedin,
      href: CONTACT_LINKS.linkedin,
      external: true,
    },
  ];

  return (
    <Container className="py-16">
      <PageHeader title={t.contact.title} subtitle={t.contact.subtitle} />

      <dl className="flex max-w-xl flex-col gap-3">
        {rows.map((row) => (
          <Card key={row.key} className="flex items-center gap-3">
            <dt className="shrink-0 text-fg-subtle" title={row.label}>
              <row.icon size={18} aria-hidden="true" />
              <span className="sr-only">{row.label}</span>
            </dt>
            <dd className="min-w-0">
              <a
                href={row.href}
                {...(row.external
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
                className="block truncate font-medium text-accent transition-colors hover:text-accent-strong"
              >
                {row.value}
              </a>
            </dd>
          </Card>
        ))}
      </dl>
    </Container>
  );
}

import Image from "next/image";
import { notFound } from "next/navigation";
import { Github, Linkedin } from "lucide-react";

import Container from "@/components/Container";
import Card from "@/components/Card";
import Tag from "@/components/Tag";
import SectionHeader from "@/components/SectionHeader";
import { posts, projects } from "@/lib/content";
import { CONTACT_LINKS, getDictionary, isLang } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const t = getDictionary(lang);
  return { title: t.home.role, description: t.home.bio };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  const t = getDictionary(lang);
  const featuredPosts = posts.getItems(lang).slice(0, 3);
  const featuredProjects = projects.getItems(lang).slice(0, 2);

  return (
    <>
      <Container className="py-16 sm:py-24">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          <div className="min-w-0">
            <p className="font-mono text-sm text-accent">{t.home.greeting}</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-fg sm:text-5xl lg:text-6xl">
              {t.home.name}
            </h1>
            <h2 className="mt-3 text-lg font-medium text-fg-muted sm:text-2xl">
              {t.home.role}
            </h2>
            <p className="mt-5 max-w-prose leading-relaxed text-fg-muted">
              {t.home.bio}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={CONTACT_LINKS.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-sm font-semibold text-fg transition-colors hover:border-border-strong hover:bg-surface-sunken"
              >
                <Github size={18} />
                <span>GitHub</span>
              </a>
              <a
                href={CONTACT_LINKS.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-sm font-semibold text-fg transition-colors hover:border-border-strong hover:bg-surface-sunken"
              >
                <Linkedin size={18} />
                <span>LinkedIn</span>
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap gap-2">
              {t.home.skills.map((skill) => (
                <li key={skill}>
                  <Tag>{skill}</Tag>
                </li>
              ))}
            </ul>
          </div>

          {/* 移动端置顶（order-first），md 以上回到右列 */}
          <div className="order-first flex justify-center md:order-last">
            {/* 放在 public/ 而非仓库根目录：根目录的 import 拿不到 public
                的缓存头。原图 189KB 且内嵌 iPhone 的 EXIF 定位坐标，
                已缩放至 640px 宽、剥离全部元数据并转为 WebP（39KB）。 */}
            <Image
              src="/portrait.webp"
              alt={t.home.name}
              width={640}
              height={853}
              priority
              className="size-44 rounded-full border border-border object-cover shadow-[var(--shadow-card)] sm:size-56 md:size-72"
            />
          </div>
        </div>
      </Container>

      <Container className="pb-4">
        <section className="border-t border-border pt-12">
          <SectionHeader
            title={t.home.featuredBlog}
            actionHref={`/${lang}/blog`}
            actionLabel={t.common.viewAll}
          />
          {featuredPosts.length === 0 ? (
            <p className="text-sm text-fg-subtle">{t.common.emptyPosts}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {featuredPosts.map((post) => (
                <Card key={post.slug} href={`/${lang}/blog/${post.slug}`}>
                  <h3 className="text-lg font-semibold text-fg transition-colors group-hover:text-accent">
                    {post.title}
                  </h3>
                  <p className="mt-1 font-mono text-sm text-fg-subtle">
                    {post.date}
                  </p>
                  {post.summary && (
                    <p className="mt-2 leading-relaxed text-fg-muted">
                      {post.summary}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </Container>

      <Container className="pb-16">
        <section className="pt-12">
          <SectionHeader
            title={t.home.featuredProjects}
            actionHref={`/${lang}/projects`}
            actionLabel={t.common.viewAll}
          />
          {featuredProjects.length === 0 ? (
            <p className="text-sm text-fg-subtle">{t.common.emptyProjects}</p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {featuredProjects.map((project) => (
                <Card key={project.slug} href={`/${lang}/projects/${project.slug}`}>
                  <h3 className="text-lg font-semibold text-fg">
                    {project.title}
                  </h3>
                  {project.summary && (
                    <p className="mt-2 leading-relaxed text-fg-muted">
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
        </section>
      </Container>
    </>
  );
}

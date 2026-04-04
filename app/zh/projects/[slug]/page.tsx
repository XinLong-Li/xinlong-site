import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, getProjectSlugs } from "@/lib/projects";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = getProjectSlugs("zh");
  return slugs.map((slug) => ({ slug }));
}

export default async function ZhProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject("zh", slug);
  if (!project) return notFound();

  return (
    <main className="container">
      <article className="section" style={{ maxWidth: 860, margin: "0 auto" }}>
        <p style={{ marginBottom: 16 }}>
          <Link href="/zh/projects" className="section-link">
            ← 返回项目列表
          </Link>
        </p>
        <h1>{project.title}</h1>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: 8 }}>{project.date}</p>
        {project.summary && <p style={{ marginBottom: 16 }}>{project.summary}</p>}
        {!!project.tags?.length && (
          <div className="project-tags" style={{ marginBottom: 20 }}>
            {project.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
        )}
        <div dangerouslySetInnerHTML={{ __html: project.contentHtml }} />
      </article>
    </main>
  );
}

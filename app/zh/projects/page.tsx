import Link from "next/link";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "项目 - 李新龙",
  description: "机器人与嵌入式系统项目展示",
};

export default function ZhProjects() {
  const projects = getProjects("zh");

  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <h1>项目</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          机器人运动控制与嵌入式系统开发项目
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {projects.map((project) => (
            <article key={project.slug} className="project-card">
              <h3>
                <Link href={`/zh/projects/${project.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {project.title}
                </Link>
              </h3>
              <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: 8 }}>{project.date}</p>
              {project.summary && <p style={{ marginBottom: 12 }}>{project.summary}</p>}
              {!!project.tags?.length && (
                <div className="project-tags">
                  {project.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "Projects - Xinlong Li",
  description: "Robotics and embedded systems projects",
};

export default function EnProjects() {
  const projects = getProjects("en");

  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <h1>Projects</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          Robot motion control and embedded systems development projects
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {projects.map((project) => (
            <article key={project.slug} className="project-card">
              <h3>
                <Link href={`/en/projects/${project.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
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

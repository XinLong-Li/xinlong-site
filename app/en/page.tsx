import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "Xinlong Li - Embedded Software Engineer",
  description: "Specializing in robot motion control and embedded systems",
};

export default function HomeEn() {
  const posts = getPosts("en").slice(0, 3);
  const projects = getProjects("en").slice(0, 2);
  return (
    <>
      <section className="section hero">
        <span className="pre">Hi, I am</span>
        <h1>Xinlong Li</h1>
        <h2>Embedded Software Engineer / Robot Motion Control</h2>
        <p className="hero-desc">
          Specializing in robot motion control, robotic arm development, and real-time embedded systems. Committed to seamlessly integrating control algorithms with hardware for high-precision, highly reliable automation solutions.
        </p>
        <div className="skills-grid">
          <div className="skill-tag">C/C++</div>
          <div className="skill-tag">ROS/ROS2</div>
          <div className="skill-tag">Kinematics/Dynamics</div>
          <div className="skill-tag">STM32/ARM</div>
          <div className="skill-tag">RTOS</div>
          <div className="skill-tag">PID/MPC Control</div>
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2>Featured Blog</h2>
          <Link href="/en/blog" className="section-link">
            View All →
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map((post) => (
            <div key={post.slug} className="project-card">
              <h3>
                <Link href={`/en/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h3>
              <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: 8 }}>{post.date}</p>
              {post.summary && <p>{post.summary}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2>Featured Projects</h2>
          <Link href="/en/projects" className="section-link">
            View All →
          </Link>
        </div>
        {projects.map((project) => (
          <div key={project.slug} className="project-card" style={{ marginBottom: 16 }}>
            <h3>
              <Link href={`/en/projects/${project.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
                {project.title}
              </Link>
            </h3>
            {project.summary && <p>{project.summary}</p>}
            {!!project.tags?.length && (
              <div className="project-tags">
                {project.tags.map((tag) => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  );
}

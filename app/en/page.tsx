import Link from "next/link";
import { getPosts } from "@/lib/posts";

export default function HomeEn() {
  const posts = getPosts("en").slice(0, 5);
  return (
    <>
      <section className="section hero" id="home">
        <span className="pre">Hi, my name is</span>
        <h1>Xinlong Li</h1>
        <h2>Building efficient full‑stack solutions</h2>
        <p style={{ maxWidth: 680, color: "#8892b0" }}>
          I focus on engineering practice and product delivery, tackling complex problems with modern stacks. Currently into high‑performance web apps, distributed systems and automation tools.
        </p>
        <div className="skills-grid">
          <div className="skill-tag">TypeScript</div>
          <div className="skill-tag">React / Next.js</div>
          <div className="skill-tag">Node.js</div>
          <div className="skill-tag">Go</div>
          <div className="skill-tag">Docker</div>
          <div className="skill-tag">PostgreSQL</div>
        </div>
      </section>

      <section className="section" id="blog">
        <h2 style={{ marginBottom: 12 }}>Blog (latest)</h2>
        <ul>
          {posts.map((post) => (
            <li key={post.slug} style={{ marginBottom: 8 }}>
              <Link href={`/en/blog/${post.slug}`}>
                <strong>{post.title}</strong> — <small>{post.date}</small>
              </Link>
              {post.summary && <div style={{ color: "#8892b0" }}>{post.summary}</div>}
            </li>
          ))}
        </ul>
        <p><Link href="/en/blog">More →</Link></p>
      </section>

      <section className="section" id="projects">
        <h2 style={{ marginBottom: 12 }}>Featured Projects</h2>
        <div className="project-card">
          <h3>CloudMonitor</h3>
          <p>Realtime metrics dashboard for distributed systems. High throughput ingestion and WASM-accelerated rendering.</p>
          <div className="project-tags"><span>#Rust</span><span>#React</span><span>#gRPC</span></div>
        </div>
        <div className="project-card">
          <h3>SmartFlow</h3>
          <p>Plugin-based automation engine on Node.js enabling low-code workflow orchestration.</p>
          <div className="project-tags"><span>#Node.js</span><span>#Redis</span><span>#Next.js</span></div>
        </div>
      </section>

      <section className="section" id="resume">
        <h2>Resume</h2>
        <p style={{ color: "#8892b0" }}>Background and experience snapshot.</p>
        <p><Link href="/en/resume">View resume →</Link></p>
      </section>

      <section className="section" id="contact">
        <div className="contact-box">
          <h2>Contact</h2>
          <p style={{ color: "#8892b0", marginTop: 8 }}>For collaboration or talk invitations, drop me an email.</p>
          <a className="btn" href="mailto:lixinlong@example.com">Say Hello</a>
        </div>
      </section>
    </>
  );
}

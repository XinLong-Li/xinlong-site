import Link from "next/link";
import Image from "next/image";
import meImage from "../../me.jpeg";
import { Github, Linkedin } from "lucide-react";
import { getPosts } from "@/lib/posts";
import { getProjects } from "@/lib/projects";

export const metadata = {
  title: "李新龙 - 嵌入式软件工程师",
  description: "专注于机器人运动控制与嵌入式系统开发",
};

export default function HomeZh() {
  const posts = getPosts("zh").slice(0, 3);
  const projects = getProjects("zh").slice(0, 2);

  return (
    <>
      <section className="section hero">
        <div className="hero-layout">
          <div className="hero-copy">
            <span className="pre">你好，我是</span>
            <h1>李新龙</h1>
            <h2>嵌入式软件工程师 / 机器人运动控制</h2>
            <p className="hero-desc">
              专注于机器人运动控制、机械臂开发和实时嵌入式系统。致力于将控制算法与硬件完美结合，实现高精度、高可靠性的自动化解决方案。
            </p>
            <div className="hero-socials">
              <a className="social-link" href="https://github.com/XinLong-Li" target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github size={18} />
                <span>GitHub</span>
              </a>
              <a className="social-link" href="https://www.linkedin.com/in/xin-long-li/" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <Linkedin size={18} />
                <span>LinkedIn</span>
              </a>
            </div>
            <div className="skills-grid">
              <div className="skill-tag">C/C++</div>
              <div className="skill-tag">ROS/ROS2</div>
              <div className="skill-tag">运动学/动力学</div>
              <div className="skill-tag">STM32/ARM</div>
              <div className="skill-tag">实时系统</div>
              <div className="skill-tag">PID/MPC控制</div>
            </div>
          </div>

          <div className="hero-portrait-wrap">
            <Image
              src={meImage}
              alt="李新龙头像"
              width={360}
              height={360}
              className="hero-portrait"
              priority
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2>精选博客</h2>
          <Link href="/zh/blog" className="section-link">
            查看全部 →
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map((post) => (
            <div key={post.slug} className="project-card">
              <h3>
                <Link href={`/zh/blog/${post.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
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
          <h2>精选项目</h2>
          <Link href="/zh/projects" className="section-link">
            查看全部 →
          </Link>
        </div>
        {projects.map((project) => (
          <div key={project.slug} className="project-card" style={{ marginBottom: 16 }}>
            <h3>
              <Link href={`/zh/projects/${project.slug}`} style={{ color: "inherit", textDecoration: "none" }}>
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

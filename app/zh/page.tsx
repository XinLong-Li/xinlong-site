import Link from "next/link";
import { getPosts } from "@/lib/posts";

export default function HomeZh() {
  const posts = getPosts("zh").slice(0, 5);
  return (
    <>
        <section className="section hero" id="home">
          <span className="pre">你好，我的名字是</span>
          <h1>李新龙</h1>
          <h2>专注于构建高效的全栈解决方案</h2>
          <p style={{ maxWidth: 680, color: "#8892b0" }}>
            我关注工程实践与产品落地，使用现代技术栈解决复杂问题。目前侧重高性能 Web 应用、分布式系统与自动化工具。
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
        <h2 style={{ marginBottom: 12 }}>博客（最近）</h2>
        <ul>
          {posts.map((post) => (
            <li key={post.slug} style={{ marginBottom: 8 }}>
              <Link href={`/zh/blog/${post.slug}`}>
                <strong>{post.title}</strong> — <small>{post.date}</small>
              </Link>
              {post.summary && <div style={{ color: "#8892b0" }}>{post.summary}</div>}
            </li>
          ))}
        </ul>
        <p><Link href="/zh/blog">查看更多 →</Link></p>
      </section>

      <section className="section" id="projects">
        <h2 style={{ marginBottom: 12 }}>精选项目</h2>
        <div className="project-card">
          <h3>CloudMonitor 高性能监控看板</h3>
          <p>分布式系统的实时指标可视化平台。支持高吞吐数据注入，WASM 加速渲染，实现毫秒级响应。</p>
          <div className="project-tags"><span>#Rust</span><span>#React</span><span>#gRPC</span></div>
        </div>
        <div className="project-card">
          <h3>SmartFlow 自动化工作流引擎</h3>
          <p>基于 Node.js 的插件化自动化工具，通过低代码编排部署流程。</p>
          <div className="project-tags"><span>#Node.js</span><span>#Redis</span><span>#Next.js</span></div>
        </div>
      </section>

      <section className="section" id="resume">
        <h2>简历</h2>
        <p style={{ color: "#8892b0" }}>背景与经历概览。</p>
        <p><Link href="/zh/resume">查看简历 →</Link></p>
      </section>

      <section className="section" id="contact">
        <div className="contact-box">
          <h2>联系我</h2>
          <p style={{ color: "#8892b0", marginTop: 8 }}>合作、演讲或交流，欢迎邮件联系。</p>
          <a className="btn" href="mailto:lixinlong@example.com">打个招呼</a>
        </div>
      </section>
    </>
  );
}
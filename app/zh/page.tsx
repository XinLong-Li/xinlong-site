import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const metadata = {
  title: "李新龙 - 嵌入式软件工程师",
  description: "专注于机器人运动控制与嵌入式系统开发",
};

export default function HomeZh() {
  const posts = getPosts("zh").slice(0, 3);
  return (
    <>
      <section className="section hero">
        <span className="pre">你好，我是</span>
        <h1>李新龙</h1>
        <h2>嵌入式软件工程师 / 机器人运动控制</h2>
        <p style={{ maxWidth: 680, color: "#000" }}>
          专注于机器人运动控制、机械臂开发和实时嵌入式系统。致力于将控制算法与硬件完美结合，实现高精度、高可靠性的自动化解决方案。
        </p>
        <div className="skills-grid">
          <div className="skill-tag">C/C++</div>
          <div className="skill-tag">ROS/ROS2</div>
          <div className="skill-tag">运动学/动力学</div>
          <div className="skill-tag">STM32/ARM</div>
          <div className="skill-tag">实时系统</div>
          <div className="skill-tag">PID/MPC控制</div>
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2>精选博客</h2>
          <Link href="/zh/blog" style={{ color: "#000", fontSize: "0.95rem", textDecoration: "underline" }}>
            查看全部 →
          </Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {posts.map((post) => (
            <div key={post.slug} className="project-card">
              <h3>
                <Link href={`/zh/blog/${post.slug}`} style={{ color: "#000", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h3>
              <p style={{ color: "#666", fontSize: "0.85rem", marginBottom: 8 }}>{post.date}</p>
              {post.summary && <p style={{ color: "#000" }}>{post.summary}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2>精选项目</h2>
          <Link href="/zh/projects" style={{ color: "#000", fontSize: "0.95rem", textDecoration: "underline" }}>
            查看全部 →
          </Link>
        </div>
        <div className="project-card" style={{ marginBottom: 16 }}>
          <h3>六轴机械臂运动控制系统</h3>
          <p>基于 ROS 的六轴机械臂控制系统，实现逆运动学求解、轨迹规划和力控。支持示教再现、视觉抓取等功能。</p>
          <div className="project-tags"><span>#ROS</span><span>#C++</span><span>#运动学</span></div>
        </div>
        <div className="project-card">
          <h3>移动机器人导航与定位</h3>
          <p>集成激光 SLAM 和视觉里程计的移动机器人导航系统，支持自主建图、路径规划和避障。</p>
          <div className="project-tags"><span>#SLAM</span><span>#ROS2</span><span>#导航</span></div>
        </div>
      </section>
    </>
  );
}
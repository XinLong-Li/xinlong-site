import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const metadata = {
  title: "Xinlong Li - Embedded Software Engineer",
  description: "Specializing in robot motion control and embedded systems",
};

export default function HomeEn() {
  const posts = getPosts("en").slice(0, 3);
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
        <div className="project-card" style={{ marginBottom: 16 }}>
          <h3>6-DOF Robotic Arm Control System</h3>
          <p>ROS-based control system for 6-axis robotic arm with inverse kinematics, trajectory planning, and force control. Supports teach pendant, visual grasping, and more.</p>
          <div className="project-tags"><span>#ROS</span><span>#C++</span><span>#Kinematics</span></div>
        </div>
        <div className="project-card">
          <h3>Mobile Robot Navigation & Localization</h3>
          <p>Navigation system integrating laser SLAM and visual odometry for autonomous mapping, path planning, and obstacle avoidance.</p>
          <div className="project-tags"><span>#SLAM</span><span>#ROS2</span><span>#Navigation</span></div>
        </div>
      </section>
    </>
  );
}

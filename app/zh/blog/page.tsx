import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const revalidate = 60;

export const metadata = {
  title: "博客 - 李新龙",
  description: "技术博客和文章",
};

export default function BlogListPageZh() {
  const posts = getPosts("zh");
  return (
    <main className="container">
      <section className="section">
        <h1 style={{ marginBottom: 24 }}>博客</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          分享技术经验、学习笔记和思考
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {posts.map((post) => (
            <article key={post.slug} className="project-card">
              <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                <Link href={`/zh/blog/${post.slug}`} style={{ color: "#f97316", textDecoration: "none" }}>
                  {post.title}
                </Link>
              </h2>
              <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: 12 }}>
                {post.date}
              </p>
              {post.summary && (
                <p style={{ color: "#666", lineHeight: 1.6 }}>
                  {post.summary}
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
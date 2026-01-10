import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const revalidate = 60;

export const metadata = {
  title: "Blog - Xinlong Li",
  description: "Technical blog and articles",
};

export default function EnBlogListPage() {
  const posts = getPosts("en");
  return (
    <main className="container">
      <section className="section">
        <h1 style={{ marginBottom: 24 }}>Blog</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          Sharing technical experience, learning notes and thoughts
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {posts.map((post) => (
            <article key={post.slug} className="project-card">
              <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
                <Link href={`/en/blog/${post.slug}`} style={{ color: "#f97316", textDecoration: "none" }}>
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

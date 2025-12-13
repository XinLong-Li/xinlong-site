import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const revalidate = 60;

export default function EnBlogListPage() {
  const posts = getPosts("en");
  return (
    <section>
      <h1>Blog</h1>
      <p>Local Markdown blog, sorted by date.</p>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/en/blog/${post.slug}`}>
              <strong>{post.title}</strong> — <small>{post.date}</small>
            </Link>
            {post.summary && <div>{post.summary}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

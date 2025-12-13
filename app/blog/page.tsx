import Link from "next/link";
import { getPosts } from "@/lib/posts";

export const revalidate = 60;

export default function BlogListPage() {
  const posts = getPosts("zh");
  return (
    <section>
      <h1>博客</h1>
      <p>本地 Markdown 博客，按时间排序。</p>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <strong>{post.title}</strong> — <small>{post.date}</small>
            </Link>
            {post.summary && <div>{post.summary}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}

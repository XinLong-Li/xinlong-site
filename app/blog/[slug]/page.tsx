import { notFound } from "next/navigation";
import { getPost, getPostSlugs } from "@/lib/posts";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = getPostSlugs("zh");
  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost("zh", slug);
  if (!post) return notFound();
  return (
    <article>
      <h1>{post.title}</h1>
      <p><small>{post.date}</small></p>
      {post.summary && <p>{post.summary}</p>}
      <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
    </article>
  );
}

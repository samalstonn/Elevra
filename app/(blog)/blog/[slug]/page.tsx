import prisma from "@/prisma/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { marked } from "marked";
marked.setOptions({ gfm: true, breaks: true });

interface Props {
  params: Promise<{ slug: string }> | { slug: string };
}

export const revalidate = 60;

export default async function BlogPostPage({ params }: Props) {
  const awaited = params instanceof Promise ? await params : params;
  const { slug } = awaited;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });
  if (!post || post.status !== "PUBLISHED") notFound();

  const sidebarPosts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: { id: true, title: true, slug: true },
  });

  const html = DOMPurify.sanitize(marked.parse(post.contentMd) as string);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 flex flex-row gap-12">
      <aside className="w-64 hidden md:block border-r pr-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Posts
        </h2>
        <ul className="space-y-3">
          {sidebarPosts.map((sp) => (
            <li key={sp.id}>
              <Link
                href={`/blog/${sp.slug}`}
                className={`$${
                  /* intentionally left not interfering with existing class merging */ ""
                } ${
                  sp.slug === post.slug
                    ? "text-purple-700 font-medium"
                    : "text-gray-700 hover:text-purple-700"
                } text-sm leading-snug`}
              >
                {sp.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <article className="flex-1 max-w-3xl">
        <h1 className="text-5xl font-bold text-purple-800 mb-6 tracking-tight leading-tight">
          {post.title}
        </h1>
        {post.authorName && (
          <p className="text-sm text-gray-500 mb-10">
            By {post.authorName}{" "}
            {post.publishedAt
              ? "• " + new Date(post.publishedAt).toLocaleDateString()
              : ""}
          </p>
        )}
        <div
          className="prose prose-purple max-w-none prose-headings:scroll-mt-28 prose-p:leading-relaxed prose-li:leading-relaxed prose-img:rounded-lg prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  );
}

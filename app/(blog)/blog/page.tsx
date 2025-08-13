import prisma from "@/prisma/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60; // ISR

export default async function BlogIndexPage() {
  const posts = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });

  if (!posts) notFound();

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-5xl font-bold text-purple-800 mb-12 tracking-tight">
        Blog
      </h1>
      <div className="grid gap-12 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((p) => (
          <article
            key={p.id}
            className="rounded-xl border p-7 md:p-8 bg-white/70 backdrop-blur shadow-sm hover:shadow-md transition flex flex-col space-y-4"
          >
            <h2 className="text-2xl font-semibold text-gray-900 leading-snug">
              <Link href={`/blog/${p.slug}`}>{p.title}</Link>
            </h2>
            {p.authorName && (
              <p className="text-sm text-gray-500">
                By {p.authorName}{" "}
                {p.publishedAt
                  ? "• " + new Date(p.publishedAt).toLocaleDateString()
                  : ""}
              </p>
            )}
            {p.excerpt && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line line-clamp-5">
                {p.excerpt}
              </p>
            )}
            <div className="pt-2">
              <Link
                href={`/blog/${p.slug}`}
                className="text-purple-600 text-sm font-medium hover:underline"
              >
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

import { MetadataRoute } from "next";
import prisma from "@/prisma/prisma";
import { BlogStatus, SubmissionStatus } from "@prisma/client";

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.elevracommunity.com").replace(/\/$/, "");
export const revalidate = 3600; // re-generate the sitemap every hour - extra clicks!

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
    { path: "/candidates", changeFrequency: "monthly", priority: 0.7 },
    {
      path: "/candidates/vendor-marketplace",
      changeFrequency: "weekly",
      priority: 0.6,
    },
    { path: "/vendors", changeFrequency: "monthly", priority: 0.7 },
    { path: "/live-elections", changeFrequency: "daily", priority: 0.8 },
    { path: "/results", changeFrequency: "daily", priority: 0.8 },
    { path: "/submit", changeFrequency: "monthly", priority: 0.6 },
    { path: "/feedback", changeFrequency: "yearly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [candidates, vendors, posts] = await Promise.all([
      prisma.candidate.findMany({
        where: { hidden: false, status: SubmissionStatus.APPROVED },
        select: { slug: true, updatedAt: true },
      }),
      prisma.vendor.findMany({
        where: { hidden: false, status: SubmissionStatus.APPROVED },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { status: BlogStatus.PUBLISHED },
        select: { slug: true, publishedAt: true, updatedAt: true },
      }),
    ]);

    entries.push(
      ...candidates.map(({ slug, updatedAt }) => ({
        url: `${BASE_URL}/candidate/${slug}`,
        lastModified: updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...vendors.map(({ slug, updatedAt }) => ({
        url: `${BASE_URL}/candidates/vendor-marketplace/${slug}`,
        lastModified: updatedAt ?? now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...posts.map(({ slug, publishedAt, updatedAt }) => ({
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: publishedAt ?? updatedAt ?? now,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }))
    );
  } catch (error) {
    console.error("Failed to generate dynamic sitemap entries", error);
  }

  return entries;
}

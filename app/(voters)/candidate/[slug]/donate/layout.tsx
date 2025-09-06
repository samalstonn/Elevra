import prisma from "@/prisma/prisma";
import type { Metadata } from "next";

interface Params {
  slug: string;
}

export async function generateMetadata({
  params,
}: {
  params: Params | Promise<Params>;
}): Promise<Metadata> {
  const resolved = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { slug: resolved.slug },
    select: { name: true },
  });
  return { title: candidate ? `Donate – ${candidate.name}` : "Donate" };
}

export default function DonateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


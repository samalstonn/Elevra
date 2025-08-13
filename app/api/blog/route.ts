import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

function isAdminUser(userId: string | null): boolean {
  if (!userId) return false;
  const raw = process.env.ADMIN_USER_IDS || "";
  // Extract all Clerk user ids present in the env string (works even if multiline / invalid JSON)
  const matches: string[] = raw.match(/user_[A-Za-z0-9]+/g) || [];
  if (matches.includes(userId)) return true;
  return false;
}

async function ensureAdmin(userId: string | null): Promise<boolean> {
  if (isAdminUser(userId)) return true;
  if (!userId) return false;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return Boolean(user.privateMetadata?.isAdmin);
  } catch {
    return false;
  }
}

// GET /api/blog?limit=5 -> latest published posts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const includeDrafts = searchParams.get("includeDrafts") === "1";
  let userId: string | null = null;
  if (includeDrafts) {
    const authState = await auth();
    userId = authState.userId;
  }
  const isAdmin = includeDrafts && isAdminUser(userId);
  const posts = await prisma.blogPost.findMany({
    where: isAdmin ? {} : { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
  return NextResponse.json(posts);
}

// POST /api/blog -> create new post (draft by default)
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!(await ensureAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { title, contentMd, authorName, tags, coverImage, status, excerpt } =
      body;
    if (!title || !contentMd) {
      return NextResponse.json(
        { error: "Title and contentMd required" },
        { status: 400 }
      );
    }
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    // ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const now = new Date();
    const generatedExcerpt = (excerpt ?? contentMd).slice(0, 240);
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        contentMd,
        authorName: authorName || null,
        tags: Array.isArray(tags) ? tags : [],
        coverImage: coverImage || null,
        status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
        publishedAt: status === "PUBLISHED" ? now : null,
        excerpt: generatedExcerpt,
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PATCH /api/blog -> update existing post by id
export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!(await ensureAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const {
      id,
      title,
      contentMd,
      authorName,
      tags,
      coverImage,
      status,
      excerpt,
    } = body;
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    let slug = existing.slug;
    if (title && title !== existing.title) {
      const baseSlug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      slug = baseSlug;
      let counter = 1;
      while (await prisma.blogPost.findUnique({ where: { slug } })) {
        if (slug === existing.slug) break; // keep original if collision is itself
        slug = `${baseSlug}-${counter++}`;
      }
    }

    const publishedAt =
      status === "PUBLISHED" && !existing.publishedAt
        ? new Date()
        : existing.publishedAt;

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        slug,
        contentMd: contentMd ?? existing.contentMd,
        excerpt: excerpt
          ? excerpt.slice(0, 240)
          : existing.excerpt ??
            (contentMd
              ? contentMd.slice(0, 240)
              : existing.contentMd.slice(0, 240)),
        authorName: authorName === undefined ? existing.authorName : authorName,
        tags: tags
          ? Array.isArray(tags)
            ? tags
            : existing.tags
          : existing.tags,
        coverImage: coverImage === undefined ? existing.coverImage : coverImage,
        status:
          status === "PUBLISHED"
            ? "PUBLISHED"
            : status === "DRAFT"
            ? "DRAFT"
            : existing.status,
        publishedAt,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog?id=123
export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!(await ensureAdmin(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const idStr = searchParams.get("id");
  if (!idStr)
    return NextResponse.json({ error: "id required" }, { status: 400 });
  const id = parseInt(idStr, 10);
  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

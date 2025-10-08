import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";

export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Expect a multipart/form-data with “file” field
  const formData = await req.formData();
  const candidateSlug = formData.get("candidateSlug");
  if (typeof candidateSlug !== "string") {
    return NextResponse.json(
      { error: "Missing candidateSlug" },
      { status: 400 }
    );
  }
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file provided under the 'file' field" },
      { status: 400 }
    );
  }

  // Validate file type (image or video)
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: "Only image or video files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size (10MB for images, 200MB for videos)
  const maxSize = file.type.startsWith("image/")
    ? 10 * 1024 * 1024
    : 200 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: `File size exceeds the ${
          file.type.startsWith("image/") ? "10MB" : "200MB"
        } limit`,
      },
      { status: 400 }
    );
  }

  // Key under blocks/ folder
  const folder = file.type.startsWith("image/") ? "images" : "videos";
  const key = `blocks/${candidateSlug}/${folder}/${Date.now()}_${file.name}`;

  try {
    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return NextResponse.json(
      {
        url: blob.url,
        downloadUrl: blob.downloadUrl,
        key: blob.pathname,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Blob upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

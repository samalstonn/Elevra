import { NextResponse } from "next/server";
import { put } from "@vercel/blob"; // Vercel Blob SDK

/**
 * POST  /api/blob/signed-url
 * Body: { type: "image" | "video", filename: string }
 * Returns: { uploadUrl: string; url: string }
 *
 * The frontend will do: fetch(uploadUrl, { method:"PUT", body:file })
 * then store `url` in the ContentBlock.
 */
export async function POST(req: Request) {
  const { type, filename } = await req.json();

  if (!["image", "video"].includes(type) || typeof filename !== "string") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Determine allowed content‑type
  const contentType =
    type === "image" ? "image/webp" : "video/mp4"; // we'll transcode later

  // Key structure: blocks/<timestamp>-<filename>
  const key = `blocks/${Date.now()}-${filename}`;

  // Generate the signed URL (put() with no body returns uploadUrl + url)
  const blob = await put(key, {
    access: "public",
    contentType,
    addRandomSuffix: false, // we want readable keys
    generateUploadUrl: true,
  });

  return NextResponse.json({
    uploadUrl: blob.uploadUrl,
    url: blob.url,
  });
}

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function PUT(req: NextRequest) {
  // Expect a multipart/form-data with “file” field
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "No file provided under the 'file' field" },
      { status: 400 }
    );
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image files are allowed" },
      { status: 400 }
    );
  }

  // Validate file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File size exceeds the 5MB limit" },
      { status: 400 }
    );
  }

  const key = `uploads/${Date.now()}_${file.name}`;
  try {
    const blob = await put(key, file, {
      access: "public",
      addRandomSuffix: true,
      // By default, the SDK will read your BLOB_READ_WRITE_TOKEN from env
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

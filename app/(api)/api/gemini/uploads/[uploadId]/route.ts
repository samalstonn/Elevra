import { auth } from "@clerk/nextjs/server";
import { requireAdminOrSubAdmin } from "@/lib/admin-auth";
import { getUploadProgress } from "@/lib/gemini/queue";

export async function GET(
  _req: Request,
  context: { params: Promise<{ uploadId: string }> }
) {
  const params = await context.params;
  const { userId } = await auth();
  const flags = await requireAdminOrSubAdmin(userId);
  if (!flags) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upload = await getUploadProgress(params.uploadId);
  if (!upload) {
    return new Response("Not Found", { status: 404 });
  }

  return Response.json({ upload });
}

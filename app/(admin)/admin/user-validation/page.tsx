import prisma from "@/prisma/prisma";
import AdminUserValidationClient from "./AdminUserValidationClient";

export const dynamic = "force-dynamic";

export default async function AdminUserValidationPage() {
  const validationRequests = await prisma.userValidationRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <AdminUserValidationClient validationRequests={validationRequests} />;
}

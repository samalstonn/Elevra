import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import { Toaster } from "@/components/ui/toaster";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in our database as a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { clerkUserId: user.id },
  });

  if (!vendor) {
    // If user is authenticated but not a vendor in our DB
    // This could happen if registration process failed midway
    redirect("/vendors?tab=signup");
  }

  return (
    <>
      <div style={{ width: "72%" }}>
        {children}
        <Toaster />
      </div>
    </>
  );
}

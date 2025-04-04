import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

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
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { clerkUserId: user.id },
    });

    if (!vendor) {
      // If user is authenticated but not a vendor in our DB
      // This could happen if registration process failed midway
      redirect("/vendors?tab=signup");
    }
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Database error</h2>
          <p className="text-gray-600">
            Unable to fetch your vendor profile. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ width: "72%" }}>{children}</div>
    </>
  );
}

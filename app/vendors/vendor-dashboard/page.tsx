import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";

export default async function VendorDashboard() {
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
    redirect("/sign-up");
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Vendor Dashboard</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {vendor.name}!</h2>
        <p className="mb-4">
          Your account is{" "}
          {vendor.status
            ? "APPROVED"
            : "pending verification. Please look out for an email from the Elevra Team."}
          .
        </p>

        <div className="bg-purple-50 p-4 rounded-md">
          <h3 className="font-medium mb-2">Your Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Email</p>
              <p>{vendor.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p>{vendor.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p>
                {vendor.city}, {vendor.state}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Subscription</p>
              <p>{vendor.subscription}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

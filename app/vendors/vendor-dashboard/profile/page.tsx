import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import VendorDashboardLayout from "../VendorDashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import VendorProfileForm from "./VendorProfileForm";
import { ServiceCategoryType } from "@prisma/client";

export default async function VendorProfilePage() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  let vendor = null;
  try {
    // Check if user exists in our database as a vendor
    vendor = await prisma.vendor.findUnique({
      where: { clerkUserId: user.id },
      include: {
        serviceCategories: true,
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Database error</h2>
          <p className="text-gray-600">
            Unable to fetch profile data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    redirect("/vendors?tab=signup");
  }

  // Get all service categories from the database
  const serviceCategories = await prisma.serviceCategory.findMany();

  // Map vendor's selected categories to their IDs for the form
  const selectedCategoryIds = vendor.serviceCategories.map(
    (category) => category.id
  );

  // Organize categories by type for the form
  const categoriesByType: Record<
    string,
    { id: number; name: string; type: ServiceCategoryType }[]
  > = {};

  serviceCategories.forEach((category) => {
    const type = category.type;
    if (!categoriesByType[type]) {
      categoriesByType[type] = [];
    }
    categoriesByType[type].push(category);
  });

  return (
    <VendorDashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Profile Management
          </h1>
          <p className="text-muted-foreground">
            Update your vendor profile information and service categories
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>
              Your public profile information that will be displayed to
              candidates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VendorProfileForm
              vendor={vendor}
              categoriesByType={categoriesByType}
              selectedCategoryIds={selectedCategoryIds}
            />
          </CardContent>
        </Card>
      </div>
    </VendorDashboardLayout>
  );
}

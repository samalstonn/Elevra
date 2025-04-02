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
import { Badge } from "@/components/ui/badge";
import SubscriptionPricingTable from "./SubscriptionPricingTable";

export default async function VendorSubscriptionPage() {
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
    redirect("/vendors?tab=signup");
  }

  return (
    <VendorDashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Subscription Management
          </h1>
          <p className="text-muted-foreground">
            Upgrade your subscription to unlock additional features
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>
                  Your current subscription plan and status
                </CardDescription>
              </div>
              <Badge
                variant={
                  vendor.subscription === "PREMIUM"
                    ? "default"
                    : vendor.subscription === "STANDARD"
                    ? "secondary"
                    : "outline"
                }
              >
                {vendor.subscription.charAt(0) +
                  vendor.subscription.slice(1).toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">
                {vendor.subscription === "FREE" && "Basic Vendor"}
                {vendor.subscription === "STANDARD" && "Standard Vendor"}
                {vendor.subscription === "PREMIUM" && "Premium Vendor"}
              </h3>
              <p className="text-sm text-purple-700 mb-4">
                {vendor.subscription === "FREE" &&
                  "You are currently on the free plan with limited features. Upgrade to get more visibility and tools."}
                {vendor.subscription === "STANDARD" &&
                  "You're enjoying enhanced visibility and lead analytics. Consider Premium for maximum exposure."}
                {vendor.subscription === "PREMIUM" &&
                  "You're on our top-tier plan with maximum visibility and all premium features."}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-3 rounded-md border border-purple-100">
                  <h4 className="text-sm font-medium text-gray-700">
                    Visibility
                  </h4>
                  <p className="text-sm text-gray-600">
                    {vendor.subscription === "FREE" && "Basic listing"}
                    {vendor.subscription === "STANDARD" &&
                      "Enhanced visibility"}
                    {vendor.subscription === "PREMIUM" && "Premium visibility"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-md border border-purple-100">
                  <h4 className="text-sm font-medium text-gray-700">
                    Analytics
                  </h4>
                  <p className="text-sm text-gray-600">
                    {vendor.subscription === "FREE" && "Limited insights"}
                    {vendor.subscription === "STANDARD" && "Full analytics"}
                    {vendor.subscription === "PREMIUM" && "Advanced analytics"}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-md border border-purple-100">
                  <h4 className="text-sm font-medium text-gray-700">
                    Portfolio Items
                  </h4>
                  <p className="text-sm text-gray-600">
                    {vendor.subscription === "FREE" && "Up to 3 items"}
                    {vendor.subscription === "STANDARD" && "Up to 10 items"}
                    {vendor.subscription === "PREMIUM" && "Unlimited items"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade Your Subscription</CardTitle>
            <CardDescription>
              Choose the plan that works best for your business needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionPricingTable currentPlan={vendor.subscription} />
          </CardContent>
        </Card>
      </div>
    </VendorDashboardLayout>
  );
}

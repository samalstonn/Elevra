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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioItemForm from "./PortfolioItemForm";
import PortfolioItemList from "./PortfolioItemList";

export default async function VendorPortfolioPage() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in our database as a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { clerkUserId: user.id },
    include: {
      portfolio: {
        orderBy: {
          id: "desc",
        },
      },
    },
  });

  if (!vendor) {
    redirect("/vendors?tab=signup");
  }

  return (
    <VendorDashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Portfolio Management
          </h1>
          <p className="text-muted-foreground">
            Showcase your work and highlight your expertise
          </p>
        </div>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="view">View Portfolio</TabsTrigger>
            <TabsTrigger value="add">Add New Item</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Portfolio</CardTitle>
                <CardDescription>
                  {vendor.portfolio.length > 0
                    ? `You have ${vendor.portfolio.length} portfolio items`
                    : "You haven't added any portfolio items yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioItemList
                  portfolioItems={vendor.portfolio}
                  vendorId={vendor.id}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Portfolio Item</CardTitle>
                <CardDescription>
                  Create a new showcase of your work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioItemForm vendorId={vendor.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </VendorDashboardLayout>
  );
}

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
import TestimonialsList from "./TestimonialsList";
import TestimonialRequestForm from "./TestimonialsRequestForm";

export default async function VendorTestimonialsPage() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in our database as a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { clerkUserId: user.id },
    include: {
      testimonials: {
        include: {
          candidate: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      candidate: {
        select: {
          id: true,
          name: true,
          position: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!vendor) {
    redirect("/vendors?tab=signup");
  }

  // Calculate average rating
  const averageRating =
    vendor.testimonials.length > 0
      ? vendor.testimonials.reduce(
          (sum, testimonial) => sum + testimonial.rating,
          0
        ) / vendor.testimonials.length
      : 0;

  return (
    <VendorDashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            View and request testimonials from candidates
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Testimonial Overview</CardTitle>
            <CardDescription>
              You have {vendor.testimonials.length} testimonials with an average
              rating of {averageRating.toFixed(1)} out of 5
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Total Testimonials</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {vendor.testimonials.length}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Average Rating</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {averageRating.toFixed(1)}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-1">Recent Activity</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {vendor.testimonials.length > 0
                    ? `${new Date(
                        vendor.testimonials[0].createdAt
                      ).toLocaleDateString()}`
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="view" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="view">View Testimonials</TabsTrigger>
            <TabsTrigger value="request">Request Testimonial</TabsTrigger>
          </TabsList>

          <TabsContent value="view" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Testimonials</CardTitle>
                <CardDescription>
                  {vendor.testimonials.length > 0
                    ? `Showing ${vendor.testimonials.length} testimonials from candidates`
                    : "You haven't received any testimonials yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestimonialsList testimonials={vendor.testimonials} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="request" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Request a Testimonial</CardTitle>
                <CardDescription>
                  Send a testimonial request to a candidate you've worked with
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TestimonialRequestForm
                  vendorId={vendor.id}
                  candidates={vendor.candidate}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </VendorDashboardLayout>
  );
}

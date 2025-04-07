import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/prisma/prisma";
import VendorDashboardLayout from "./VendorDashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Users,
  Briefcase,
  Star,
  BadgeCheck,
  User,
  Images,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import VendorAnalyticsChart from "./VendorAnalyticsChart";
import {
  Vendor,
  Testimonial,
  PortfolioItem,
  ServiceCategory,
  Candidate,
} from "@prisma/client";

type TestimonialWithCandidates = Testimonial & {
  candidate: Candidate;
};

type VendorExtended = Vendor & {
  testimonials: TestimonialWithCandidates[];
  portfolio: PortfolioItem[];
  serviceCategories: ServiceCategory[];
};

export default async function VendorDashboard() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in our database as a vendor
  let vendor: VendorExtended | null;
  try {
    vendor = await prisma.vendor.findUnique({
      where: { clerkUserId: user.id },
      include: {
        portfolio: true,
        testimonials: {
          include: {
            candidate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 3,
        },
        serviceCategories: true,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor data:", error);
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Error</h2>
        <p className="mt-2">
          Failed to load vendor dashboard. Please try again later.
        </p>
      </div>
    );
  }
  if (!vendor) {
    // If user is authenticated but not a vendor in our DB
    // This could happen if registration process failed midway
    redirect("/vendors?tab=signup");
  }

  // Fetch profile views from analytics system
  const analytics =
    // await prisma.vendorAnalytics.findUnique({
    //   where: { vendorId: vendor.id },
    //   select: { profileViews: true },
    // });
    {
      profileViews: 120,
    };
  const profileViews = analytics?.profileViews || 0;

  // Calculate average rating
  const averageRating =
    vendor.testimonials.length > 0
      ? vendor.testimonials.reduce((acc, curr) => acc + curr.rating, 0) /
        vendor.testimonials.length
      : 0;

  return (
    <VendorDashboardLayout vendor={vendor}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {vendor.name}
          </h1>
          {vendor.verified && (
            <div className="flex items-center gap-1 text-green-600">
              <BadgeCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Verified Vendor</span>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Profile Views
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profileViews}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Portfolio Items
              </CardTitle>
              <Briefcase className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendor.portfolio.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendor.portfolio.length === 0
                  ? "Add your first portfolio item"
                  : "Last updated 2 days ago"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Testimonials
              </CardTitle>
              <Star className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendor.testimonials.length}
              </div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(averageRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs text-muted-foreground">
                  {averageRating.toFixed(1)} average
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Subscription
              </CardTitle>
              <BarChart className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {vendor.subscription.toLowerCase()}
              </div>
              <p className="text-xs text-muted-foreground">
                {vendor.subscription === "FREE" ? (
                  <Link href="/vendors/vendor-dashboard/subscription">
                    <span className="text-purple-600 hover:underline">
                      Upgrade now
                    </span>
                  </Link>
                ) : (
                  "Active plan"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Profile Activity</CardTitle>
              <CardDescription>
                Profile views and engagement metrics for the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <VendorAnalyticsChart />
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Testimonials</CardTitle>
              <CardDescription>
                Latest feedback from your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.testimonials.length > 0 ? (
                <div className="space-y-4">
                  {vendor.testimonials.map((testimonial) => (
                    <div
                      key={testimonial.id}
                      className="border-b pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">
                          {testimonial.candidate.name}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3 w-3 ${
                                star <= testimonial.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {testimonial.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(testimonial.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <Star className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    No testimonials yet
                  </p>
                  <Link href="/vendors/vendor-dashboard/testimonials">
                    <Button variant="outline" size="sm">
                      Request Testimonials
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>
                Your selected service categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vendor.serviceCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {vendor.serviceCategories.map((category) => (
                    <div
                      key={category.id}
                      className="bg-purple-50 text-purple-700 rounded-full px-3 py-1 text-sm"
                    >
                      {category.name}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <p className="text-sm text-gray-500 mb-3">
                    No service categories selected
                  </p>
                  <Link href="/vendors/vendor-dashboard/profile">
                    <Button variant="outline" size="sm">
                      Update Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you might want to perform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/vendors/vendor-dashboard/profile">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/vendors/vendor-dashboard/portfolio">
                  <Button variant="outline" className="w-full justify-start">
                    <Images className="mr-2 h-4 w-4" />
                    Add Portfolio Item
                  </Button>
                </Link>
                <Link href="/vendors/vendor-dashboard/testimonials">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Testimonial
                  </Button>
                </Link>
                <Link href="/vendors/vendor-dashboard/subscription">
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VendorDashboardLayout>
  );
}

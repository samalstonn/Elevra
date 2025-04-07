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
import {
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Eye,
  Users,
  MousePointerClick,
  Calendar,
  TrendingUp,
  Mail,
} from "lucide-react";
import VendorAnalyticsOverview from "./VendorAnalyticsOverview";
import VendorTrafficChart from "./VendorTrafficChart";
import VendorSourcesChart from "./VendorSourcesChart";
import VendorEngagementChart from "./VendorEngagementChart";

export default async function VendorAnalyticsPage() {
  // Get the current user from Clerk
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user exists in our database as a vendor
  const vendor = await prisma.vendor.findUnique({
    where: { clerkUserId: user.id },
    include: {
      portfolio: true,
      testimonials: true,
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
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor your profile&apos;s performance and engagement
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Profile Views
              </CardTitle>
              <Eye className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">247</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Unique Visitors
              </CardTitle>
              <Users className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">129</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Engagement Rate
              </CardTitle>
              <Activity className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18.4%</div>
              <p className="text-xs text-muted-foreground">
                +2.3% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Contact Clicks
              </CardTitle>
              <MousePointerClick className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32</div>
              <p className="text-xs text-muted-foreground">
                +7 from last month
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Overview</CardTitle>
            <CardDescription>
              Summary of your profile performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <VendorAnalyticsOverview />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="traffic" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-3">
            <TabsTrigger value="traffic" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              <span>Traffic</span>
            </TabsTrigger>
            <TabsTrigger value="sources" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Sources</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span>Engagement</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="traffic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Analysis</CardTitle>
                <CardDescription>
                  Profile traffic over time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Time Period
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">
                          Last 30 Days
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Total Views
                      </div>
                      <div className="text-xl font-bold mt-1">728</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Avg. Daily Views
                      </div>
                      <div className="text-xl font-bold mt-1">24.3</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Peak Day
                      </div>
                      <div className="text-xl font-bold mt-1">March 15</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="h-[350px]">
                  <VendorTrafficChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>
                  Where your profile visitors are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-[350px] flex items-center justify-center">
                    <VendorSourcesChart />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg mb-4">
                      Source Breakdown
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                          <span className="text-sm">Direct Search (42%)</span>
                        </div>
                        <span className="text-sm font-medium">306 views</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                          <span className="text-sm">
                            Candidate Referrals (28%)
                          </span>
                        </div>
                        <span className="text-sm font-medium">204 views</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Category Browse (18%)</span>
                        </div>
                        <span className="text-sm font-medium">131 views</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span className="text-sm">External Links (12%)</span>
                        </div>
                        <span className="text-sm font-medium">87 views</span>
                      </div>
                    </div>

                    <div className="mt-8">
                      <h3 className="font-medium text-lg mb-4">Key Insights</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            1
                          </div>
                          <span>
                            Most profile views come from direct searches,
                            indicating strong brand recognition.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            2
                          </div>
                          <span>
                            Candidate referrals are your second-highest traffic
                            source, showing good relationship building.
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-2 flex-shrink-0 mt-0.5">
                            3
                          </div>
                          <span>
                            Consider promoting your profile through more
                            external channels to increase that segment.
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="engagement" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Engagement</CardTitle>
                <CardDescription>
                  How visitors interact with your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Average Time on Profile
                      </div>
                      <div className="text-xl font-bold mt-1">3m 42s</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Portfolio Views
                      </div>
                      <div className="text-xl font-bold mt-1">183</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-50">
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-gray-500">
                        Contact Button Clicks
                      </div>
                      <div className="text-xl font-bold mt-1">32</div>
                    </CardContent>
                  </Card>
                </div>
                <div className="h-[350px]">
                  <VendorEngagementChart />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Month-over-month changes in key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Profile Views</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">
                      +12%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: "72%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Unique Visitors</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">
                      +5%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MousePointerClick className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Engagement Actions</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">
                      +8%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: "58%" }}
                  ></div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm">Contact Rate</span>
                  </div>
                  <div className="flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm font-medium text-green-500">
                      +3%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: "42%" }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Growth Opportunities</CardTitle>
              <CardDescription>
                Recommendations to improve your metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-700 mb-1">
                    Complete Your Profile
                  </h3>
                  <p className="text-sm text-blue-600 mb-2">
                    Vendors with complete profiles get 2.3x more views.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-500">
                      Profile completion
                    </span>
                    <span className="text-xs font-medium text-blue-500">
                      75%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-700 mb-1">
                    Add More Portfolio Items
                  </h3>
                  <p className="text-sm text-purple-600 mb-2">
                    Each portfolio item increases engagement by approximately
                    15%.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-500">
                      Portfolio items
                    </span>
                    <span className="text-xs font-medium text-purple-500">
                      {vendor.portfolio.length}/10
                    </span>
                  </div>
                  <div className="w-full bg-purple-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full"
                      style={{
                        width: `${(vendor.portfolio.length / 10) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-700 mb-1">
                    Collect More Testimonials
                  </h3>
                  <p className="text-sm text-green-600 mb-2">
                    Vendors with 5+ testimonials receive 70% more contact
                    requests.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-green-500">Testimonials</span>
                    <span className="text-xs font-medium text-green-500">
                      {vendor.testimonials.length}/5
                    </span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{
                        width: `${Math.min(
                          (vendor.testimonials.length / 5) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-700 mb-1">
                    Upgrade Your Subscription
                  </h3>
                  <p className="text-sm text-yellow-600">
                    Premium subscribers appear in 2.8x more search results than
                    free accounts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </VendorDashboardLayout>
  );
}

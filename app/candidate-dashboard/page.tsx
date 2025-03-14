"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { LineChartComponent } from "@/components/ui/line-chart";
import { PieChartComponent } from "@/components/ui/pie-chart";
import { DollarSign } from "lucide-react";

export default function CandidateDashboard() {

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen py-8 px-4 sm:px-8 lg:px-16"
      >
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800">Welcome Back, [Candidate Name]</h1>
          <p className="text-gray-900">Real-time insights on your campaign performance</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Page Views Trend Card */}
          <Card className="shadow-lg">
            <LineChartComponent />
          </Card>

           <PieChartComponent />

          {/* Recent Activity Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="text-purple-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-1">
                <li className="text-purple-700">🔸 10 new endorsements received</li>
                <li className="text-purple-700">🔍 5 searches mentioning your name</li>
                <li className="text-purple-700">👥 8 new followers this week</li>
              </ul>
            </CardContent>
          </Card>

          {/* Recent Donations Card */}
          <Card className="shadow-lg">
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="text-purple-500" />
                Recent Donations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li className="flex justify-between text-purple-700">
                  <span>John Doe</span>
                  <span className="font-semibold">$250</span>
                </li>
                <li className="flex justify-between text-purple-700">
                  <span>Jane Smith</span>
                  <span className="font-semibold">$100</span>
                </li>
                <li className="flex justify-between text-purple-700">
                  <span>Michael Johnson</span>
                  <span className="font-semibold">$500</span>
                </li>
                <li className="flex justify-between text-purple-700">
                  <span>Emily Davis</span>
                  <span className="font-semibold">$75</span>
                </li>
                <li className="flex justify-between text-purple-700">
                  <span>Chris Brown</span>
                  <span className="font-semibold">$300</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
}
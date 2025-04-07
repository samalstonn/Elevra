"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TabButton } from "@/components/ui/tab-button";
import { FeatureCard } from "@/components/ui/feature-card";
import VendorSignupForm from "@/app/vendors/VendorSignUpForm";
import VendorLoginForm from "@/app/vendors/VendorLoginForm";

export default function VendorsPage() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="min-h-screen flex flex-col items-center w-full overflow-x-hidden mx-auto mb-8">
      {/* Hero Section */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: "easeOut",
              staggerChildren: 0.2,
            },
          },
        }}
        className="flex flex-col items-center text-center w-full max-w-screen"
      >
        {/* Vendor Navigation Tabs */}
        <div className="w-full max-w-4xl flex justify-center">
          <div className="flex gap-2 mx-auto p-1 rounded-full">
            <TabButton
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            >
              Home
            </TabButton>
            <TabButton
              active={activeTab === "signup"}
              onClick={() => setActiveTab("signup")}
            >
              Join as a Vendor
            </TabButton>
            <TabButton
              active={activeTab === "login"}
              onClick={() => setActiveTab("login")}
            >
              Vendor Login
            </TabButton>
          </div>
        </div>

        {activeTab === "home" && (
          <div className="flex flex-col items-center max-w-4xl mx-auto px-4 mt-12">
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple-900 mb-6"
            >
              Connect with Political Campaigns
            </motion.h1>

            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut", delay: 0.1 },
                },
              }}
              className="text-xl text-gray-700 mb-8 max-w-3xl"
            >
              Offer your services to political candidates and campaigns. Grow
              your business while supporting democracy.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full my-12">
              <FeatureCard
                icon="📊"
                title="Reach Campaigns"
                description="Connect with active political campaigns looking for your services"
              />
              <FeatureCard
                icon="💼"
                title="Showcase Your Work"
                description="Build a portfolio that highlights your political expertise"
              />
              <FeatureCard
                icon="🚀"
                title="Grow Your Business"
                description="Expand your client base with campaigns that need your skills"
              />
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut", delay: 0.3 },
                },
              }}
              className="flex flex-col sm:flex-row gap-4 mt-8"
            >
              <Button
                variant="purple"
                size="lg"
                onClick={() => setActiveTab("signup")}
              >
                Join as a Vendor
              </Button>
            </motion.div>
          </div>
        )}

        {activeTab === "signup" && (
          <div className="flex flex-col items-center max-w-4xl mx-auto px-4 mt-12">
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
              className="text-4xl sm:text-5xl font-bold text-purple-700 mb-6"
            >
              Join Our Vendor Network
            </motion.h1>
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut", delay: 0.1 },
                },
              }}
              className="text-lg text-gray-600 text-center max-w-xl mb-8"
            >
              Create an account to showcase your services to political campaigns
              and connect with candidates.
            </motion.p>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
                },
              }}
              className="w-full max-w-md"
            >
              {/* <VendorSignupForm /> */}
              <VendorSignupForm />
            </motion.div>
          </div>
        )}

        {activeTab === "login" && (
          <div className="flex flex-col items-center max-w-4xl mx-auto px-4 mt-12">
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut" },
                },
              }}
              className="text-4xl sm:text-5xl font-bold text-purple-700 mb-6"
            >
              Welcome Back
            </motion.h1>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
                },
              }}
              className="w-full max-w-md"
            >
              {/* <VendorLoginForm /> */}
              <VendorLoginForm />
            </motion.div>
          </div>
        )}
      </motion.main>
    </div>
  );
}

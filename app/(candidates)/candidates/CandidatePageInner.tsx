"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TabButton } from "@/components/ui/tab-button";
import { FeatureCard } from "@/components/ui/feature-card";
import CandidateLoginForm from "@/app/(candidates)/candidates/CandidateLoginForm";
import { useRouter, useSearchParams } from "next/navigation";
import ResultsSearchBar from "@/components/ResultsSearchBar";

export default function CandidatesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "home";
  const electionIdFromParams = searchParams.get("electionId") || undefined;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [electionId] = useState(electionIdFromParams);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    if (electionId) {
      url.searchParams.set("electionId", electionId);
    } else {
      url.searchParams.delete("electionId");
    }
    router.push(url.pathname + url.search);
  }, [activeTab, electionId, router]);

  return (
    <div className="min-h-screen flex flex-col items-center w-full overflow-x-hidden mx-auto mb-8">
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
        <div className="w-full max-w-4xl flex justify-center">
          <div className="flex gap-2 mx-auto p-1 rounded-full">
            <TabButton
              active={activeTab === "home"}
              onClick={() => setActiveTab("home")}
            >
              Home
            </TabButton>
            <TabButton
              active={activeTab === "login"}
              onClick={() => setActiveTab("login")}
            >
              Candidate Login
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
              className="text-4xl sm:text-5xl md:text-6xl font-bold text-purple-700 mb-6"
            >
              Launch Your Political Campaign
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
              Join our platform to share information and manage your campaign.
            </motion.p>

            {/* Candidate self-search */}
            <div className="bg-white rounded-lg p-4 w-full flex flex-col items-center">
              <p className="text-sm text-gray-700 mb-3">
                Heard of yourself on Elevra before? Search for your name below!
              </p>
              <div className="min-w-full">
                <ResultsSearchBar
                  placeholder="Search for your name..."
                  apiEndpoint="/api/candidates"
                  shadow={true}
                />
              </div>
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
                onClick={() => setActiveTab("login")}
              >
                Join as a Candidate
              </Button>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full my-12">
              <FeatureCard
                icon="🔍"
                title="Become Discoverable"
                description="Local voters can find you easily and learn about your campaign"
              />
              <FeatureCard
                icon="🎯"
                title="Strategize Effectively"
                description="Access tools and expertise to sharpen your campaign strategy"
              />
              <FeatureCard
                icon="📈"
                title="Expand Your Reach"
                description="Leverage professional services to increase voter engagement"
              />
            </div>
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
              Welcome Back, Candidate
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
              <CandidateLoginForm />
            </motion.div>
          </div>
        )}
      </motion.main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { TabButton } from "@/components/ui/tab-button";
import CandidateSubmissionForm from "./CandidateSubmissionForm";
import ElectionSubmissionForm from "./ElectionSubmissionForm";

export default function SubmitPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("election");

  // Restore active tab from localStorage if available
  useEffect(() => {
    const savedTab = localStorage.getItem("submitActiveTab");
    if (savedTab) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save active tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("submitActiveTab", value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 max-w-3xl py-8"
    >
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
        >
          <Link href="/">
            <FaArrowLeft /> Back to Home
          </Link>
        </Button>
      </div>

      <div className="bg-white p-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
          Submit Information
        </h1>

        <p className="text-gray-600 mb-6 text-center">
          Help your community by submitting information about elections and
          candidates. The Elevra team will review all submissions before being
          published.
        </p>

        {/* Replace the Tabs/TabsList/TabsTrigger with your custom TabButton */}
        <div className="flex justify-center space-x-4 mb-8">
          <TabButton
            active={activeTab === "election"}
            onClick={() => handleTabChange("election")}
          >
            Submit Election
          </TabButton>
          <TabButton
            active={activeTab === "candidate"}
            onClick={() => handleTabChange("candidate")}
          >
            Submit Candidate
          </TabButton>
        </div>

        {/* Render the content based on the active tab */}
        {activeTab === "election" && (
          <div className="pt-4">
            <ElectionSubmissionForm userId={user?.id} />
          </div>
        )}

        {activeTab === "candidate" && (
          <div className="pt-4">
            <CandidateSubmissionForm userId={user?.id} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

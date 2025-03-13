"use client";

import Link from "next/link";
import { Card, CardContent } from "../components/Card";
import Image from "next/image";
import { Candidate } from "../data/test_data";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { FaDonate } from "react-icons/fa";

interface CandidateSectionProps {
    candidates: Candidate[];
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

export default function CandidateSection({ candidates }: CandidateSectionProps) {
    // Generate campaigns from candidate test data using the 'election' field
    const campaignNames = Array.from(new Set(candidates.map((candidate) => candidate.election)));
    const positionDescriptions: Record<string, string> = {
        "Town Supervisor (Dryden Town)": "Oversees town operations, manages budgets, and represents Dryden Town residents.",
        "Village Mayor (Dryden Village)": "Manages village operations, budgets, and represents Dryden Village residents.",
        "State Senate Race": "Focuses on state-level legislation, working on education and local economic development.",
        "Local Mayor Campaign": "Dedicated to improving community services, local infrastructure, and public safety.",
        "Presidential Election": "Addresses national issues including the economy, healthcare, and international relations.",
        // Add more mappings as needed
    };
    const campaigns = campaignNames.map((election, index) => ({
        id: election,
        title: election,
        description:
            positionDescriptions[election] ||
            `Campaign for ${election} elections. Learn more about our vision and plans.`,
        startDate: "2025-03-18",
        active: index % 2 === 0, // For demo purposes: even-index campaigns are active
    }));

    return (
        <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >

            {/* Campaign Cards Section */}
            <div className="mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="bg-transparent" >
                            <CardContent>
                                <p className="text-sm text-gray-800">{campaign.description}</p>
                                <p className="text-sm text-gray-800 mt-2">
                                    Election Date: {new Date(campaign.startDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="mt-2 text-sm font-medium text-gray-800">
                                    Status: <span className={campaign.active ? "text-green-600" : "text-red-600"}>
                                        {campaign.active ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Responsive Grid Layout */}
            <motion.div className="grid grid-cols-3 gap-4">
                {candidates.map((candidate, index) => (
                    <motion.div key={index} variants={cardVariants}>
                        <Link href={`/candidate/${candidate.name.replace(/\s+/g, "-").toLowerCase()}`}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                                    <CardContent className="flex flex-col items-start gap-1">
                                        <Image
                                            src={candidate.photo || "/default-profile.png"}
                                            alt={`${candidate.name}'s photo`}
                                            width={64}
                                            height={64}
                                            className="h-20 w-20 rounded-full object-cover shadow-md"
                                        />
                                        <h2 className="text-md font-semibold text-gray-900 mt-2 text-left line-clamp-2">
                                            {candidate.name}
                                        </h2>
                                        <p className="text-gray-800 text-sm text-left">{candidate.position}</p>
                                        <p className={`text-gray-500 text-xs text-left ${candidate.position.length > 50 ? "line-clamp-4" : "line-clamp-5"}`}>
                                            {candidate.bio}
                                        </p>

                                        {/* Donate Button */}
                                        <motion.div className="absolute bottom-0" 
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}>
                                            <Button variant="green" size="lg" onClick={() => { /* placeholder function */ }} className="flex items-center gap-2">
                                                <FaDonate />
                                                <span>Donate</span>
                                            </Button>
                                        </motion.div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
}
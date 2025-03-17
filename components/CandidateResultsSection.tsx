"use client";

import Link from "next/link";
import { Card, CardContent } from "../components/Card";
import Image from "next/image";
import { Candidate } from "../data/test_data";
import { motion } from "framer-motion";
import CheckoutButton from "@/components/DonateButton";

interface CandidateSectionProps {
    candidates: Candidate[];
    election: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
};

export default function CandidateSection({ candidates, election }: CandidateSectionProps) {
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
    const campaigns = campaignNames.map((election, _) => ({
        id: election,
        title: election,
        description:
            positionDescriptions[election] ||
            `Campaign for ${election} elections. Learn more about each candidate's vision.`,
        startDate: election.includes("Dryden") ? "2025-03-18" : "2025-04-21",
        active: true, // For demo purposes: even-index campaigns are active
    }));

    return (
        <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 transition-colors">
                {election}
            </h2>

            {/* Campaign Cards Section */}
            <div className="mb-2 md:mb-6">
                <div className="grid grid-cols-1 gap-4">
                    {campaigns.map((campaign) => (
                        <Card key={campaign.id} className="bg-transparent">
                            <CardContent>
                                <p className="text-sm text-gray-800">{campaign.description}</p>
                                <p className="text-sm text-gray-800 mt-2">
                                    <strong>Positions:</strong> 2
                                </p>
                                <p className="text-sm text-gray-800 mt-2">
                                    <strong>Election Date:</strong> {new Date(campaign.startDate).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="mt-2 text-sm font-medium text-gray-800">
                                    <strong>Status:</strong> <span className={campaign.active ? "text-green-600" : "text-red-600"}>
                                        {campaign.active ? "Active" : "Inactive"}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Responsive Layout for Candidate Cards */}
            <motion.div className="flex flex-nowrap gap-2 overflow-x-auto md:grid md:grid-cols-3 sm:gap-2 md:flex-wrap md:overflow-visible justify-start">
                {candidates.map((candidate, index) => (
                    <motion.div key={index} variants={cardVariants} className="flex-shrink-0">
                        <Link href={`/candidate/${candidate.name.replace(/\s+/g, "-").toLowerCase()}`}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                                    <CardContent className="flex flex-col items-start sm:items-center gap-2">
                                        <Image
                                            src={candidate.photo || "/default-profile.png"}
                                            alt={`${candidate.name}'s photo`}
                                            width={64}
                                            height={64}
                                            className="h-20 w-20 rounded-full object-cover shadow-md"
                                        />
                                        <h2 className="text-xl font-semibold text-gray-900 mt-2 text-center sm:text-left line-clamp-2">
                                            {candidate.name}
                                        </h2>
                                        <p className="w-[85%] text-gray-800 text-sm text-center sm:text-left">{candidate.position}</p>
                                        <p
                                            className={`w-[65%] text-gray-500 text-xs ${
                                                candidate.position.length > 37 ? "line-clamp-3" : "line-clamp-4"
                                            }`}
                                            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
                                        >
                                            {candidate.bio}
                                        </p>

                                        {/* Donate Button */}
                                        <motion.div
                                            className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                event.preventDefault();
                                            }}
                                        >
                                            <CheckoutButton cartItems={[
                                                {
                                                    name: `Donation to ${candidate.name}'s Campaign`,
                                                    price: 10, // Price in USD
                                                    quantity: 1,
                                                },
                                            ]}/>
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
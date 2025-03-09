"use client";

import Link from "next/link";
import { Card, CardContent } from "../components/Card";
import Image from "next/image";
import { Candidate } from "../data/test_data";
import { motion } from "framer-motion";

interface CandidateSectionProps {
    candidates: Candidate[];
}

// Animation variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.15 } },
};

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

export default function CandidateSection({ candidates }: CandidateSectionProps) {
    return (
        <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >

            {/* Responsive Grid Layout */}
            <motion.div className="grid grid-cols-3 gap-4">
                {candidates.map((candidate, index) => (
                    <motion.div key={index} variants={cardVariants}>
                        <Link href={`/candidate/${candidate.name.replace(/\s+/g, "-").toLowerCase()}`}>
                            <motion.div
                                whileHover={{ scale: 1.05, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Card className="group transition-all rounded-full border cursor-pointer h-[275px] w-[350px] flex flex-col relative">
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
                                        <p className={`text-gray-500 text-xs text-left ${candidate.position.length > 50 ? "line-clamp-2" : "line-clamp-3"}`}>
                                            {candidate.bio}
                                        </p>

                                        {/* Donate Button */}
                                        <motion.div className="absolute bottom-3">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md hover:shadow-lg text-sm rounded-full w-full p-2.5"
                                            >
                                                Donate Now
                                            </motion.button>
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
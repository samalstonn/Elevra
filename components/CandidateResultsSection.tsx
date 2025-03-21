"use client";

import Link from "next/link";
import { Card, CardContent } from "../components/Card";
import Image from "next/image";
import { Candidate, Election } from "@prisma/client";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

interface CandidateSectionProps {
    candidates: Candidate[];
    election: Election;
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
    if (!candidates || candidates.length === 0) {
        return null;
    }

    return (
        <motion.div
            className="max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <h2 className="text-3xl font-semibold text-gray-900 mb-4 transition-colors">
                {election.position}
            </h2>

            {/* Campaign Cards Section */}
            <div className="mb-2 md:mb-6">
                <div className="grid grid-cols-1 gap-4">
                    <Card key={election.id} className="bg-transparent">
                        <CardContent>
                            <p className="text-sm text-gray-800">{election.description}</p>
                            <p className="text-sm text-gray-800 mt-2">
                                <strong>Positions:</strong> 2
                            </p>
                            <p className="text-sm text-gray-800 mt-2">
                                <strong>Election Date:</strong> {new Date(election.date).toLocaleDateString("en-US", {
                                    timeZone: "UTC",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })}
                            </p>
                            <p className="mt-2 text-sm font-medium text-gray-800">
                                <strong>Status:</strong> <span className={election.active ? "text-green-600" : "text-red-600"}>
                                    {election.active ? "Active" : "Inactive"}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Responsive Layout for Candidate Cards */}
            <motion.div className="flex flex-nowrap gap-2 overflow-x-auto md:grid md:grid-cols-3 sm:gap-2 md:flex-wrap md:overflow-visible justify-start">
                {candidates.map((candidate, index) => (
                    <motion.div key={index} variants={cardVariants} className="flex-shrink-0">
                        <Link href={{ pathname: `/candidate/${candidate.name.replace(/\s+/g, "-").toLowerCase()}`, query: { candidateID: candidate.id, electionID: election.id } }}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                                    <CardContent className="flex flex-col gap-2">
                                        <Image
                                            src={candidate.photo || "/default-profile.png"}
                                            alt={`${candidate.name}'s photo`}
                                            width={64}
                                            height={64}
                                            className="h-20 w-20 rounded-full object-cover shadow-md"
                                        />
                                        <h2 className="text-xl font-semibold text-gray-900 mt-2 line-clamp-2">
                                            {candidate.name}
                                        </h2>
                                        <p className="w-[85%] text-gray-800 text-sm ">{candidate.position}</p>
                                        <p
                                            className={`w-[75%] text-gray-500 text-xs ${
                                                candidate.position.length > 37 ? "line-clamp-3" : "line-clamp-4"
                                            }`}
                                            style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
                                        >
                                            {candidate.bio}
                                        </p>

                                        {/* Donate Button */}
                                        <motion.div className="absolute bottom-0" 
                                                whileHover={{ scale: 1.02 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}>
                                            <Button variant="purple" size="sm" onClick={() => { /* placeholder function */ }} className="flex items-center gap-2">
                                                <span>Learn More</span>
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
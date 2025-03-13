"use client";

import CandidateSection from "@/components/CandidateResultsSection";
import { Candidate, candidates } from "@/data/test_data";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Button } from "../../components/ui/button";

export default function ElectionResults() {
  // const zipCode = "13053"; // Placeholder ZIP code

  // Compute election filters sorted by the number of candidates
  const electionFilters = useMemo(() => {
    return [...new Set(candidates.map((candidate) => candidate.election))].sort((a, b) => {
      const countA = candidates.filter((c) => c.election === a).length;
      const countB = candidates.filter((c) => c.election === b).length;
      return countB - countA; // Sort in descending order
    });
  }, []);

  // Track the selected election filter: default to first filter
  const [selectedElection, setSelectedElection] = useState<string | null>(electionFilters[0] || null);

  // If no filter is selected => show all elections
  // If a filter is selected => show only that one
  const filteredElections = selectedElection
    ? electionFilters.filter((e) => e === selectedElection)
    : electionFilters; // no filter => all

  // Animation Variants
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="w-screen mx-auto px-4 mb-16 flex"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      {/* Filters based on Election Titles */}
      <motion.div
        className="flex flex-col items-start gap-4 bg-white min-h-[400px]"
      >
      {electionFilters.map((election) => (
        <motion.div
          key={election}
          variants={fadeInVariants}
        >
          <Button variant={`${
                    selectedElection === election
                      ? "purple"
                      : "secondary"
                    }`}
                    size = "sm"
                  onClick={() => setSelectedElection(election)}>
            <span className="font-medium">{election}</span>
          </Button>
          
        </motion.div>
      ))}
      </motion.div>

      {/* Candidate Sections */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 gap-6">
      {filteredElections.map((election) => {
        const filteredCandidates = candidates.filter(
          (candidate): candidate is Candidate => candidate.election === election
        );

        return (
          <motion.div
            key={election}
            variants={fadeInVariants}
            className="p-4 mt-4"
          >
            <h2 className="text-3xl font-semibold text-gray-900 p-3 transition-colors">
              {election}
            </h2>
            <CandidateSection candidates={filteredCandidates} />
          </motion.div>
        );
      })}
      </motion.div>
    </motion.div>
  );
}
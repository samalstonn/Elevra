"use client";

import { Search, Filter, CheckIcon } from "lucide-react";
import CandidateSection from "@/components/CandidateResultsSection";
import { Candidate, candidates } from "@/data/test_data";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";

export default function ElectionResults() {
  const zipCode = "13053"; // Placeholder ZIP code

  // Track the selected election filter: null means "no filter" => show all
  const [selectedElection, setSelectedElection] = useState<string | null>(null);

  // Compute election filters sorted by the number of candidates
  const electionFilters = useMemo(() => {
    return [...new Set(candidates.map((candidate) => candidate.election))].sort((a, b) => {
      const countA = candidates.filter((c) => c.election === a).length;
      const countB = candidates.filter((c) => c.election === b).length;
      return countB - countA; // Sort in descending order
    });
  }, [candidates]);

  // Create a stable default open/close map for each election
  const defaultOpenStates = useMemo(() => {
    const initialStates: Record<string, boolean> = {};
    electionFilters.forEach((e) => {
      initialStates[e] = true; // default each election to open
    });
    return initialStates;
  }, [electionFilters]);

  // Single state object tracking open/close for each election
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(defaultOpenStates);

  // Toggle a specific election's open/close state
  function toggleElection(election: string) {
    setOpenStates((prev) => ({
      ...prev,
      [election]: !prev[election],
    }));
  }

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
      className="w-[95%] mx-auto px-3 mb-8 flex gap-6"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      {/* Filters based on Election Titles */}
      <motion.div
        className="flex flex-col items-start gap-4 w-[220px] bg-white p-4 min-h-[400px]"
      >
      {electionFilters.map((election) => (
        <motion.button
          key={election}
          onClick={() => {
            setSelectedElection((prev) => (prev === election ? null : election));
          }}
          className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-all border border-gray-300 ${
            selectedElection === election
              ? "bg-purple-600 text-white border-purple-700"
              : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
          }`}
          variants={fadeInVariants}
        >
          <span className="font-medium">{election}</span>
        </motion.button>
      ))}
      </motion.div>

      {/* Candidate Sections */}
      <motion.div variants={fadeInVariants} className="grid grid-cols-1 gap-6">
      {filteredElections.map((election) => {
        const isOpen = openStates[election] ?? false;
        const filteredCandidates = candidates.filter(
        (candidate): candidate is Candidate => candidate.election === election
        );

        return (
        <motion.div
          key={election}
          variants={fadeInVariants}
        >
          <h2
          className="text-xl font-semibold text-gray-900 cursor-pointer hover:text-gray-600 p-3 rounded-md transition-colors inline-flex items-center"
          onClick={() => toggleElection(election)}
          >
          <span
            className={`mr-1 transform transition-transform text-xs ${
            isOpen ? "rotate-90" : "rotate-0"
            }`}
          >
            ▶︎
          </span>
          {election}
          </h2>
          {isOpen && <CandidateSection candidates={filteredCandidates} />}
        </motion.div>
        );
      })}
      </motion.div>
    </motion.div>
  );
}
"use client";

import { Election, Candidate } from "@prisma/client";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FaVoteYea,
  FaChevronLeft,
  FaChevronRight,
  FaDonate,
} from "react-icons/fa"; // Import all needed icons
import Link from "next/link";
import { Card, CardContent } from "@/components/Card";

import CandidateSection from "./CandidateResultsSection";

export type ElectionWithCandidates = Election & { candidates: Candidate[] };

export default function ElectionResultsClient({
  elections,
  initialElectionID,
}: {
  elections: ElectionWithCandidates[];
  initialElectionID?: string | null;
}) {
  // Check if there are any elections
  const hasElections = Array.isArray(elections) && elections.length > 0;

  const sortedElections = useMemo(() => {
    if (Array.isArray(elections)) {
      const sorted = [...elections];
      sorted.sort((a, b) => {
        const aHasVerified = a.candidates.some((c) => c.verified);
        const bHasVerified = b.candidates.some((c) => c.verified);

        if (aHasVerified && !bHasVerified) {
          return -1;
        }
        if (!aHasVerified && bHasVerified) {
          return 1;
        }
        return b.candidates.length - a.candidates.length;
      });
      return sorted;
    }
    return [];
  }, [elections]);

  // New: Prevent hydration errors by tracking mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize filter state for elections
  const [selectedElection, setSelectedElection] = useState<number | null>(null);

  // Set default selected election when data loads
  useEffect(() => {
    if (sortedElections.length > 0) {
      const parsedID = parseInt(initialElectionID || "", 10);
      if (!isNaN(parsedID) && sortedElections.some((e) => e.id === parsedID)) {
        setSelectedElection(parsedID);
      } else {
        setSelectedElection(sortedElections[0].id);
      }
    }
  }, [sortedElections, initialElectionID]);

  // Track the selected election filter: default to first filter
  const filteredElections = selectedElection
    ? sortedElections.filter((elec) => elec.id === selectedElection)
    : sortedElections;

  // Animation Variants
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -1000, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 1000, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) {
      updateScrollButtons();
      scroller.addEventListener("scroll", updateScrollButtons);
      return () => {
        scroller.removeEventListener("scroll", updateScrollButtons);
      };
    }
  }, [mounted, elections]);

  // No elections view
  if (!hasElections) {
    return (
      <motion.div
        className="w-screen mx-auto px-4 py-12 flex flex-col items-center"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <div className="max-w-3xl text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            No Elections Found
          </h1>
          <p className="text-gray-600 mb-8">
            There are no elections available for the selected location. Would
            you like to submit information about an upcoming election?
          </p>

          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                <CardContent className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaVoteYea size={28} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center">
                    Submit a New Election
                  </h2>
                  <p className="text-gray-500 text-sm text-center mb-4">
                    Help us keep the community informed
                  </p>
                  <Link href="/submit" className="mt-auto mb-4">
                    <Button
                      variant="purple"
                      className="flex items-center gap-2"
                    >
                      <span>Submit Election Information</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                <CardContent className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaDonate size={28} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center">
                    See Live Elections
                  </h2>
                  <p className="text-gray-500 text-sm text-center mb-4">
                    Browse currently active elections across the U.S.
                  </p>

                  <Button variant="purple">
                    <Link
                      href={`${process.env.NEXT_PUBLIC_APP_URL}/live-elections`}
                      className="flex items-center gap-2"
                    >
                      <span>Browse Elections</span>
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {!mounted ? (
        <div className="w-screen h-screen flex items-center justify-center">
          Loading...
        </div>
      ) : (
        <motion.div
          className="w-screen mx-auto px-4 mb-16 flex flex-col"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          <div className="relative">
            <motion.div
              ref={scrollRef}
              variants={fadeInVariants}
              className="flex flex-nowrap overflow-x-auto gap-4 bg-white p-4 no-scrollbar"
            >
              {sortedElections.map((elec) => (
                <Button
                  key={elec.id}
                  onClick={() => setSelectedElection(elec.id)}
                  variant={
                    selectedElection === elec.id ? "purple" : "secondary"
                  }
                  size="sm"
                >
                  <span className="font-medium">{elec.position}</span>
                </Button>
              ))}
            </motion.div>
            {canScrollLeft && (
              <div
                className="pointer-events-none absolute top-0 left-0 h-full w-24 z-0"
                style={{
                  background:
                    "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)",
                }}
              />
            )}
            {canScrollRight && (
              <div
                className="pointer-events-none absolute top-0 right-0 h-full w-24 z-0"
                style={{
                  background:
                    "linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)",
                }}
              />
            )}

            {canScrollLeft && (
              <Button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hover:bg-0"
                variant="ghost"
              >
                <FaChevronLeft className="w-5 h-5" />
              </Button>
            )}

            {canScrollRight && (
              <Button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hover:bg-0"
                variant={"ghost"}
              >
                <FaChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>

          <div className="mt-4">
            {/* Candidate Sections */}
            <motion.div
              variants={fadeInVariants}
              className="grid grid-cols-1 gap-6"
            >
              {(filteredElections || []).map((elec) => (
                <motion.div
                  key={elec.id}
                  variants={fadeInVariants}
                  className="mt-4 flex flex-col"
                >
                    <div className="flex-1">
                    <CandidateSection
                      candidates={[...elec.candidates].sort((a, b) => {
                      if (a.verified && !b.verified) return -1;
                      if (!a.verified && b.verified) return 1;
                      if (a.photo && !b.photo) return -1;
                      if (!a.photo && b.photo) return 1;
                      return 0;
                      })}
                      election={elec}
                      fallbackElections={[]}
                    />
                    </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
}

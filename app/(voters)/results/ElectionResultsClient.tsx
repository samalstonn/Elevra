"use client";

import { Election, Candidate } from "@prisma/client";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FaVoteYea, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Link from "next/link";
import { Card, CardContent } from "@/components/Card";
import CandidateSection from "./CandidateResultsSection";
import MobileCandidateResultsSection from "./MobileCandidateResultsSection";
import LiveElectionBanner from "@/components/LiveElectionBanner";

export type ElectionWithCandidates = Election & { candidates: Candidate[] };

export default function ElectionResultsClient({
  elections,
  initialElectionID,
}: {
  elections: ElectionWithCandidates[];
  initialElectionID?: string | null;
}) {
  const hasElections = elections && elections.length > 0;

  const sortedElections = useMemo(() => {
    const list = [...(elections || [])];
    list.sort((a, b) => {
      const aHas = a.candidates.some((c) => c.verified);
      const bHas = b.candidates.some((c) => c.verified);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return b.candidates.length - a.candidates.length;
    });
    return list;
  }, [elections]);

  // Suggested elections moved to LiveElectionBanner component when !hasElections

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [selectedElection, setSelectedElection] = useState<number | null>(null);
  useEffect(() => {
    if (sortedElections.length) {
      const parsed = parseInt(initialElectionID || "", 10);
      if (!isNaN(parsed) && sortedElections.some((e) => e.id === parsed))
        setSelectedElection(parsed);
      else setSelectedElection(sortedElections[0].id);
    }
  }, [sortedElections, initialElectionID]);

  const filteredElections = selectedElection
    ? sortedElections.filter((e) => e.id === selectedElection)
    : sortedElections;

  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };
  const scrollLeft = () =>
    scrollRef.current?.scrollBy({ left: -1000, behavior: "smooth" });
  const scrollRight = () =>
    scrollRef.current?.scrollBy({ left: 1000, behavior: "smooth" });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    return () => el.removeEventListener("scroll", updateScrollButtons);
  }, [mounted, elections]);

  if (!hasElections) {
    return (
      <motion.div
        className="w-full min-h-screen overflow-y-auto overflow-x-hidden mx-auto flex flex-col items-center max-w-full"
        initial="hidden"
        animate="visible"
        variants={fadeInVariants}
      >
        <div className="w-full max-w-3xl text-center mb-6 mt-6 px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            No Elections Found
          </h1>
          <p className="text-gray-600 mb-6 px-1 text-sm sm:text-base leading-relaxed">
            There are no elections available for the selected location. Would
            you like to submit information about an upcoming election?
          </p>
          <div className="flex flex-col md:flex-row md:justify-center gap-5 w-full items-stretch">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.2 }}
              className="flex-1 md:max-w-sm"
            >
              <Card className="group rounded-lg cursor-pointer h-full w-full flex flex-col shadow-md">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-6 md:py-8 px-5 h-full">
                  <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaVoteYea size={24} className="text-purple-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 text-center">
                    Submit a New Election
                  </h2>
                  <p className="text-gray-500 text-xs sm:text-sm text-center mb-1">
                    Help us keep the community informed
                  </p>
                  <Link href="/submit" className="mt-auto">
                    <Button
                      size="sm"
                      variant="purple"
                      className="flex items-center gap-2 text-sm font-medium"
                    >
                      <span>Submit Election Information</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
        <div className="mt-12 w-full">
          <LiveElectionBanner />
        </div>
      </motion.div>
    );
  }

  return (
    <>
      {!mounted ? (
        <div className="w-full h-screen flex items-center justify-center px-4">
          Loading...
        </div>
      ) : (
        <div
          className="w-full flex flex-col min-w-0"
          style={{ marginTop: "-1px" }}
        >
          <div
            className="relative bg-white"
            style={{ marginTop: 0, paddingTop: 0 }}
          >
            <motion.div
              ref={scrollRef}
              variants={fadeInVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-nowrap overflow-x-auto gap-4 p-4 no-scrollbar min-w-0"
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
              <Button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                variant="ghost"
              >
                <FaChevronLeft className="w-5 h-5" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                variant="ghost"
              >
                <FaChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>
          <motion.div
            className="px-4 mb-16"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <div className="mt-4">
              <motion.div
                variants={fadeInVariants}
                className="grid grid-cols-1 gap-6"
              >
                {filteredElections.map((elec) => (
                  <motion.div
                    key={elec.id}
                    variants={fadeInVariants}
                    className="mt-2 flex flex-col"
                  >
                    <div className="flex-1">
                      <div>
                        <div className="md:hidden">
                          <MobileCandidateResultsSection
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
                        <div className="hidden md:block">
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
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

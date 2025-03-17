"use client";

import CandidateSection from "@/components/CandidateResultsSection";
import { Candidate, candidates, zipCodeDictionary } from "@/data/test_data";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";

export default function ElectionResults() {

  const [selectedZip, _] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const zip = urlParams.get('zip');
      return zip && zipCodeDictionary[zip] ? zip : "13053";
    } else {
      return "13053";
    }
  });
  const selectedLocation = zipCodeDictionary[selectedZip];

  // New: Prevent hydration errors by tracking mount state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Instead of conditionally returning null here, we will render a fallback in the JSX

  // Compute election filters sorted by the number of candidates
  const electionFilters = useMemo(() => {
    const filteredCandidates = candidates.filter(
      (candidate) => `${candidate.city}, ${candidate.state}` === selectedLocation
    );
    return [...new Set(filteredCandidates.map((candidate) => candidate.election))].sort((a, b) => {
      const countA = filteredCandidates.filter((c) => c.election === a).length;
      const countB = filteredCandidates.filter((c) => c.election === b).length;
      return countB - countA; // Sort in descending order
    });
  }, [selectedLocation]);

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
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
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
  }, [mounted, electionFilters]);

  useEffect(() => {
    localStorage.setItem('zipCode', selectedZip);
  }, [selectedZip]);

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
          {/* Mobile Filters Header */}
          <div className="relative">
            <motion.div ref={scrollRef} variants={fadeInVariants} className="flex flex-nowrap overflow-x-auto gap-4 bg-white p-4 no-scrollbar">
              {electionFilters.map((election) => (
                <Button
                  key={election}
                  onClick={() => setSelectedElection(election)}
                  variant={selectedElection === election ? "purple" : "secondary"}
                  size="sm"
                  
                >
                  <span className="font-medium">{election}</span>
                </Button>
              ))}
            </motion.div>
          {canScrollLeft && (
            <div
              className="pointer-events-none absolute top-0 left-0 h-full w-24 z-0"
              style={{
                background: "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)"
              }}
            />
          )}
            {canScrollRight && (
              <div
                className="pointer-events-none absolute top-0 right-0 h-full w-24 z-0"
                style={{
                  background: "linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 20%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.5) 60%, rgba(255,255,255,0.3) 80%, rgba(255,255,255,0) 100%)"
                }}
              />
            )}

            {canScrollLeft && (
              <Button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hover:bg-0"
                variant="ghost"
              >
                {/* Left chevron icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5l-7.5-7.5 7.5-7.5"
                  />
                </svg>
              </Button>
            )}

            {canScrollRight && (
              <Button
                onClick={scrollRight}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 hover:bg-0"
                variant={"ghost"}
              >
                {/* Right chevron icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </Button>
            )}
          </div>

          <div className="mt-4">
            {/* Candidate Sections */}
            <motion.div variants={fadeInVariants} className="grid grid-cols-1 gap-6">
              {filteredElections.map((election) => {
                const filteredCandidates = candidates.filter(
                  (candidate): candidate is Candidate =>
                    candidate.election === election && `${candidate.city}, ${candidate.state}` === selectedLocation
                );
                return (
                    <motion.div key={election} variants={fadeInVariants} className="mt-4 flex flex-col">
                      <div className="flex-1">
                        <CandidateSection candidates={filteredCandidates} election={election}/>
                      </div>
                    </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      )}
    </>
  );
}
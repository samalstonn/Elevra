"use client";

import { Election, Candidate } from "@prisma/client";
import useSWR from "swr";
import { motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "../../components/ui/button";
import CandidateSection from "../../components/CandidateResultsSection";

type ElectionWithCandidates = Election & { candidates: Candidate[] };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ElectionResults() {
  const [location, _] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const city = urlParams.get('city');
        const state = urlParams.get('state');
        return { city: city, state: state };
      }
    } catch (error) {
      console.error("Error parsing zip code:", error);
    }
    return { city: 'Dryden', state: 'NY' };
  });
  const { data: elections, isLoading } = useSWR<ElectionWithCandidates[]>(
    `/api/elections?city=${location.city}&state=${location.state}`,
    fetcher
  );

  const sortedElections = useMemo(() => {
    return elections ? [...elections].sort((a, b) => b.candidates.length - a.candidates.length) : [];
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
    if (sortedElections.length > 0 && !selectedElection) {
      setSelectedElection(sortedElections[0].id);
    }
  }, [sortedElections, selectedElection]);

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
  }, [mounted, elections]);

  return (
    <>
      {!mounted || isLoading ? (
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
              {sortedElections.map((elec) => (
                <Button
                  key={elec.id}
                  onClick={() => setSelectedElection(elec.id)}
                  variant={selectedElection === elec.id ? "purple" : "secondary"}
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
              {(filteredElections || []).map((elec) => (
                <motion.div key={elec.id} variants={fadeInVariants} className="mt-4 flex flex-col">
                  <div className="flex-1">
                    <CandidateSection candidates={elec.candidates} election={elec} />
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
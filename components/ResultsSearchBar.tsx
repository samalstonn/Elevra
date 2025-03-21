"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { Candidate } from "@prisma/client";
import { normalizeSlug } from "@/lib/functions";


export default function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Create a ref for the container to detect clicks outside
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide results when clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setResults([]);
      return;
    }

    // Debounce the search by 300ms for real-time updates
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      fetch(`/api/candidates?search=${encodeURIComponent(searchTerm)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const term = searchTerm.toLowerCase();
            // Filter to only include candidates whose name contains the search term
            const filteredData = data.filter((candidate) =>
              candidate.name.toLowerCase().includes(term)
            );
            // Sort filtered results by the position of the term in the candidate's name (lower index is more relevant)
            const sortedData = filteredData.sort((a, b) => {
              const aIndex = a.name.toLowerCase().indexOf(term);
              const bIndex = b.name.toLowerCase().indexOf(term);
              return aIndex - bIndex;
            });
            // Show up to 5 results (if there are fewer, only those will be displayed)
            setResults(sortedData.slice(0, 5));
          } else {
            setResults([]);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching candidates:", error);
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        className="flex items-center bg-white border border-gray-300 px-3 py-2 rounded-full shadow-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.3 } }}
      >
        <Search className="text-gray-500 mr-2 w-5 h-5" />
        <input
          type="text"
          className="outline-none w-full text-sm text-gray-700 placeholder-gray-400"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </motion.div>
      {results.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-gray-300 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
          {results.map((candidate: Candidate) => (
            <li key={candidate.id} className="px-4 py-2 hover:bg-gray-100">
              <Link
                href={`/candidate/${normalizeSlug(candidate.name)}?candidateID=${candidate.id}&electionID=${candidate.electionId}`}
              >
                <div className="font-semibold">{candidate.name}</div>
                {candidate.position && (
                  <div className="text-gray-600 text-sm">{candidate.position}</div>
                )}
                {candidate.party && (
                  <div className="text-purple-500 text-xs">{candidate.party}</div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="absolute right-2 top-2 text-gray-500 text-xs">Loading...</div>
      )}
    </div>
  );
}
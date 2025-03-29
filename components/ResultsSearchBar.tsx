"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { normalizeSlug } from "@/lib/functions";

type SearchResult = {
  id: string;
  name?: string;
  electionId?: string;
  position?: string;
  city?: string;
  state?: string;
  date?: string;
  party?: string;
};

interface SearchBarProps {
  placeholder?: string;
  apiEndpoint?: string; // Added to make the endpoint configurable
  onResultSelect?: (result: SearchResult) => void; // Added callback for selection
  shadow: boolean;
}

export default function SearchBar({
  placeholder = "Search...",
  apiEndpoint = "/api/candidates", // Default to original endpoint
  onResultSelect,
  shadow,
}: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Create a ref for the container to detect clicks outside
  const containerRef = useRef<HTMLDivElement>(null);

  // Hide results when clicking outside the search container
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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
      fetch(`${apiEndpoint}?search=${encodeURIComponent(searchTerm)}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            const term = searchTerm.toLowerCase();

            // Filter results based on the search term
            // Check for name property (candidates) or position property (elections)
            const filteredData = data.filter(
              (item: SearchResult) =>
                item.name?.toLowerCase().includes(term) ||
                false ||
                item.position?.toLowerCase().includes(term) ||
                false ||
                item.city?.toLowerCase().includes(term) ||
                false ||
                item.state?.toLowerCase().includes(term) ||
                false
            );

            // Sort filtered results by relevance
            const sortedData = filteredData.sort((a, b) => {
              // For candidates
              if (a.name && b.name) {
                const aIndex = a.name.toLowerCase().indexOf(term);
                const bIndex = b.name.toLowerCase().indexOf(term);
                return aIndex - bIndex;
              }
              // For elections
              else if (a.position && b.position) {
                const aIndex = a.position.toLowerCase().indexOf(term);
                const bIndex = b.position.toLowerCase().indexOf(term);
                return aIndex - bIndex;
              }
              return 0;
            });

            // Show up to 5 results
            setResults(sortedData.slice(0, 5));
          } else {
            setResults([]);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching results:", error);
          setIsLoading(false);
        });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, apiEndpoint]);

  // Handle rendering results based on data type
  const renderResult = (item: SearchResult) => {
    // For candidates
    if (item.name && item.electionId) {
      return (
        <>
          <div className="font-semibold">{item.name}</div>
          {item.position && (
            <div className="text-gray-600 text-sm">{item.position}</div>
          )}
          {item.party && (
            <div className="text-purple-500 text-xs">{item.party}</div>
          )}
        </>
      );
    }
    // For elections
    else if (item.position) {
      return (
        <>
          <div className="font-semibold">{item.position}</div>
          {item.city && item.state && (
            <div className="text-gray-600 text-sm">
              {item.city}, {item.state}
            </div>
          )}
          {item.date && (
            <div className="text-purple-500 text-xs">
              {new Date(item.date).toLocaleDateString()}
            </div>
          )}
        </>
      );
    }

    // Generic fallback
    return (
      <div className="font-semibold">
        {item.name || item.position || "Item"}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <motion.div
        className={`flex items-center bg-white border border-gray-300 px-3 py-2 rounded-full ${
          shadow ? "shadow-md" : ""
        }`}
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
          {results.map((item, index) => (
            <li key={item.id || index} className="px-4 py-2 hover:bg-gray-100">
              {/* Render differently based on if we use onResultSelect prop */}
              {onResultSelect ? (
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    onResultSelect(item);
                    setSearchTerm("");
                    setResults([]);
                  }}
                >
                  {renderResult(item)}
                </div>
              ) : (
                // Default behavior for candidates
                <Link
                  href={`/candidate/${normalizeSlug(
                    item.name || ""
                  )}?candidateID=${item.id}&electionID=${item.electionId}`}
                >
                  {renderResult(item)}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      {isLoading && (
        <div className="absolute right-2 top-2 text-gray-500 text-xs">
          Loading...
        </div>
      )}
    </div>
  );
}

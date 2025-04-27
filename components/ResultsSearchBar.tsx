"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";

// 2) Add this just after your imports:
const CHIP_CLASS =
  "inline-flex items-center bg-gray-200 px-2 py-1 rounded-full mr-2 mb-2 text-sm";

export type SearchResult = {
  id: string;
  slug: string;
  name?: string;
  electionId?: string;
  position?: string;
  city?: string;
  state?: string;
  date?: string;
  party?: string;
};

// 1) Props
interface SearchBarProps {
  placeholder?: string;
  apiEndpoint?: string;
  /** Single item or array for multi mode */
  onResultSelect?: (result: SearchResult | SearchResult[]) => void;
  /** Enable selecting multiple items */
  multi?: boolean;
  shadow: boolean;
}

export default function SearchBar({
  placeholder = "Search...", // Keep defaults here for now, diff didn't explicitly remove them
  apiEndpoint = "/api/candidates", // Keep defaults here
  onResultSelect,
  shadow,
  multi, // Add multi here
}: SearchBarProps) {
  // 3) Track current selection
  const [selectedItems, setSelectedItems] = useState<SearchResult[]>([]);
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
            setResults(sortedData.slice(0, 10));
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
      {/* 4) Render chips if multi mode */}
      {multi && selectedItems.length > 0 && (
        <div className="flex flex-wrap mb-2">
          {selectedItems.map((item) => (
            <span key={item.id} className={CHIP_CLASS}>
              {item.name || item.position}
              <button
                type="button"
                className="ml-1 focus:outline-none"
                onClick={() => {
                  const filtered = selectedItems.filter(
                    (i) => i.id !== item.id
                  );
                  setSelectedItems(filtered);
                  onResultSelect?.(filtered); // Pass the updated array
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
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
                    if (multi) {
                      // Check if item is already selected to avoid duplicates
                      if (!selectedItems.find((i) => i.id === item.id)) {
                        const newSel = [...selectedItems, item];
                        setSelectedItems(newSel);
                        onResultSelect(newSel); // Pass the updated array
                      }
                    } else {
                      onResultSelect(item); // Pass single item
                    }
                    setSearchTerm(""); // Clear search term after selection
                    setResults([]); // Hide results after selection
                  }}
                >
                  {renderResult(item)}
                </div>
              ) : (
                // Default behavior for candidates (linking)
                <Link href={`/candidate/${item.slug}`}>
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

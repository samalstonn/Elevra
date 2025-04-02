"use client";

import { useState, useEffect } from "react";
import SearchBar from "@/components/ResultsSearchBar"; // Import the existing component
import { Button } from "@/components/ui/button";
import type { SearchResult } from "@/components/ResultsSearchBar";

// Type definition for Election data
type Election = {
  id: number;
  position: string;
  date: string;
  city: string;
  state: string;
};

interface ElectionSearchWrapperProps {
  value: string;
  onChange: (electionId: string) => void;
  onError?: (error: string | null) => void;
}

export default function ElectionSearchWrapper({
  value,
  onChange,
}: ElectionSearchWrapperProps) {
  // Get selected election details (for display)
  const [selectedElection, setSelectedElection] = useState<Election | null>(
    null
  );

  // Fetch the selected election's details when value changes
  useEffect(() => {
    if (value && value !== "new" && value !== "") {
      // This would be replaced with a real fetch if needed
      // For now just simulate retrieving election details
      fetch(`/api/elections/${value}`)
        .catch(() => {
          // Fallback mock data if endpoint doesn't exist yet
          return {
            json: () =>
              Promise.resolve({
                id: parseInt(value),
                position: "Election " + value,
                date: "2025-11-05",
                city: "Sample City",
                state: "ST",
              }),
          };
        })
        .then((res) => res.json())
        .then((data) => setSelectedElection(data))
        .catch((err) => {
          console.error("Error fetching election details:", err);
          setSelectedElection(null);
        });
    } else {
      setSelectedElection(null);
    }
  }, [value]);

  // Handle selection from the search results
  const handleElectionSelect = (election: SearchResult) => {
    onChange(election.id.toString());
  };

  return (
    <div className="space-y-3">
      {/* Display the selected election */}
      {selectedElection && (
        <div className="flex items-center justify-between bg-white border border-gray-300 px-4 py-2 rounded-xl shadow-sm">
          <div>
            <div className="font-medium">{selectedElection.position}</div>
            <div className="text-gray-600 text-sm">
              {selectedElection.city}, {selectedElection.state} •
              {new Date(selectedElection.date).toLocaleDateString()}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="text-gray-400 hover:text-gray-600"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Show search if no election is selected */}
      {!selectedElection && (
        <div className="space-y-2">
          <SearchBar
            placeholder="Search for an election..."
            // apiEndpoint="/api/elections/search"
            onResultSelect={handleElectionSelect}
            shadow={false}
          />
          <div className="flex items-center mt-2 text-purple-600 text-sm">
            <input
              type="checkbox"
              id="create-new-election"
              className="mr-2"
              checked={value === "new"}
              onChange={(e) => {
                onChange(e.target.checked ? "new" : "");
              }}
            />
            <label htmlFor="create-new-election">
              I need to create a new election
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// app/(candidate_features)/vendors/VendorLocationSelector.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { NormalizedLocation, AutocompleteSuggestion } from "@/types/geocoding";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding"; // Assuming geocoding functions are here
import { debounce } from "@/lib/debounce"; // Assuming debounce is here

interface VendorLocationSelectorProps {
  onLocationChange: (location: NormalizedLocation | null) => void;
  defaultLocation?: NormalizedLocation | null; // Optional default location
}

export function VendorLocationSelector({
  onLocationChange,
  defaultLocation = null,
}: VendorLocationSelectorProps) {
  // State for input value, suggestions, loading, selected location, and dropdown visibility
  const [inputValue, setInputValue] = useState<string>(
    defaultLocation ? `${defaultLocation.city}, ${defaultLocation.state}` : ""
  );
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuggestionsVisible, setIsSuggestionsVisible] =
    useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for detecting clicks outside

  // Debounced function to fetch suggestions
  const fetchSuggestions = useCallback(
    debounce(async (searchTerm: string) => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        setIsSuggestionsVisible(false);
        return;
      }
      setIsLoading(true);
      try {
        const results = await getLocationSuggestions(searchTerm);
        setSuggestions(results);
        setIsSuggestionsVisible(results.length > 0);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setIsSuggestionsVisible(false);
      } finally {
        setIsLoading(false);
      }
    }, 300), // Debounce suggestions fetch by 300ms
    []
  );

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    if (value === "") {
      // If input is cleared, clear the location filter
      onLocationChange(null);
      setSuggestions([]);
      setIsSuggestionsVisible(false);
    } else {
      // Fetch suggestions based on input
      fetchSuggestions(value);
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionClick = async (suggestion: AutocompleteSuggestion) => {
    setInputValue(suggestion.placeName); // Update input field
    setSuggestions([]); // Clear suggestions
    setIsSuggestionsVisible(false); // Hide dropdown
    setIsLoading(true);
    // Normalize the selected location to get city/state/coords
    const result = await normalizeLocation(suggestion.placeName);
    setIsLoading(false);
    if ("city" in result && "state" in result) {
      // Pass the normalized location up
      onLocationChange(result);
    } else {
      // Handle normalization error (e.g., show a toast)
      console.error("Normalization error:", result.message);
      onLocationChange(null); // Clear location if normalization fails
    }
  };

  // Clear the input and location filter
  const handleClearInput = () => {
    setInputValue("");
    setSuggestions([]);
    setIsSuggestionsVisible(false);
    onLocationChange(null); // Notify parent component
  };

  // Effect to handle clicks outside the component to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [containerRef]);

  // Effect to set initial location if defaultLocation changes
  useEffect(() => {
    if (defaultLocation) {
      setInputValue(`${defaultLocation.city}, ${defaultLocation.state}`);
      // Optionally trigger onLocationChange if needed on initial load
      // onLocationChange(defaultLocation);
    }
  }, [defaultLocation]); // Removed onLocationChange from deps to avoid loop

  return (
    <div className="relative w-full" ref={containerRef}>
      <label
        htmlFor="location-search"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Location
      </label>
      <div className="relative">
        <Input
          id="location-search"
          type="text"
          placeholder="City, State, or ZIP Code"
          value={inputValue}
          onChange={handleInputChange}
          style={{ width: "100%" }} // Ensure full width
          onFocus={() =>
            setIsSuggestionsVisible(
              suggestions.length > 0 && inputValue.length > 0
            )
          }
          className="pr-16 rounded-xl border-gray" // Add padding for icons
        />
        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-500" />
        )}
        {/* Clear button */}
        {inputValue && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearInput}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-gray-500 hover:text-gray-700"
            aria-label="Clear location input"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {/* Suggestions dropdown */}
      {isSuggestionsVisible && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
          <ul>
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {suggestion.placeName}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

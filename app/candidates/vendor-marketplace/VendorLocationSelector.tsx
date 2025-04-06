"use client";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import Autocomplete from "@/components/ui/Autocomplete";
import ErrorPopup from "@/components/ui/ErrorPopup";
import { AutocompleteSuggestion, NormalizedLocation } from "@/types/geocoding";
import { Loader2 } from "lucide-react";

interface VendorLocationSelectorProps {
  onLocationChange: (location: NormalizedLocation | null) => void;
  defaultLocation?: NormalizedLocation | null;
}

export default function VendorLocationSelector({
  onLocationChange,
  defaultLocation = null,
}: VendorLocationSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set default location if provided
  useEffect(() => {
    if (defaultLocation) {
      setSearchTerm(
        defaultLocation.fullAddress ||
          `${defaultLocation.city}, ${defaultLocation.state}`
      );
    }
  }, [defaultLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const debouncedFetchSuggestions = debounce(async (input: string) => {
    if (input.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const results = await getLocationSuggestions(input);
      setSuggestions(results);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      // Clear location if search term is empty
      onLocationChange(null);
    }

    if (value.trim().length >= 2) {
      setIsLoading(true);
      setShowSuggestions(true);
      debouncedFetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }

    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.city && suggestion.state && suggestion.stateName) {
      setSearchTerm(suggestion.placeName);
      setShowSuggestions(false);
      onLocationChange({
        city: suggestion.city,
        state: suggestion.state,
        stateName: suggestion.stateName,
        fullAddress: suggestion.placeName,
      });
    } else {
      setErrorMessage("Could not determine city and state from selection.");
      setShowError(true);
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    if (searchTerm.trim() === "") {
      onLocationChange(null);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await normalizeLocation(searchTerm);

      if ("message" in result) {
        // It's an error
        setErrorMessage(result.message);
        setShowError(true);
      } else {
        // Success - valid location with city and state
        onLocationChange(result);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error processing location. Please try again.");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full">
      <div ref={searchContainerRef} className="relative w-full">
        <div className="flex w-full h-12 items-stretch rounded-xl">
          <div className="flex border-none bg-[#f2f0f4] items-center justify-center pl-4 rounded-l-xl border-r-0 text-[#756388]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
            </svg>
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search vendors by location"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#141118] focus:outline-0 focus:ring-0 border-none bg-[#f2f0f4] focus:border-none h-full placeholder:text-[#756388] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-owns="location-suggestions"
            aria-controls="location-suggestions"
            aria-activedescendant={
              highlightedIndex >= 0
                ? `suggestion-${highlightedIndex}`
                : undefined
            }
            disabled={isSubmitting}
          />
        </div>

        <Autocomplete
          suggestions={suggestions}
          isLoading={isLoading}
          visible={showSuggestions}
          onSelect={handleSelectSuggestion}
          highlightedIndex={highlightedIndex}
          setHighlightedIndex={setHighlightedIndex}
        />
      </div>

      {/* Error Popup */}
      <ErrorPopup
        message={errorMessage}
        isVisible={showError}
        onClose={() => setShowError(false)}
      />
    </div>
  );
}

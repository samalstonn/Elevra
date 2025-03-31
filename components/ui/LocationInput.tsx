"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import { AutocompleteSuggestion, NormalizedLocation } from "@/types/geocoding";
import { Loader2 } from "lucide-react";
import { FaMapMarkerAlt, FaCheckCircle } from "react-icons/fa";

interface LocationInputProps {
  onLocationSelect: (city: string, state: string, fullAddress: string) => void;
  initialValue?: string;
  className?: string;
  error?: string;
}

export default function LocationInput({
  onLocationSelect,
  initialValue = "",
  className = "",
  error,
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    city: string;
    state: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debounced fetch suggestions
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
      console.error("Error fetching location suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedLocation(null);

    if (value.trim().length >= 2) {
      setIsLoading(true);
      setShowSuggestions(true);
      debouncedFetchSuggestions(value);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: AutocompleteSuggestion) => {
    setInputValue(suggestion.placeName);
    setShowSuggestions(false);

    if (suggestion.city && suggestion.state) {
      setSelectedLocation({
        city: suggestion.city,
        state: suggestion.state,
      });
      onLocationSelect(suggestion.city, suggestion.state, suggestion.placeName);
    } else {
      // Try to normalize the location if city/state not provided in suggestion
      try {
        const normalizedLocation = await normalizeLocation(
          suggestion.placeName
        );
        if (
          "city" in normalizedLocation &&
          "state" in normalizedLocation &&
          normalizedLocation.city &&
          normalizedLocation.state
        ) {
          setSelectedLocation({
            city: normalizedLocation.city,
            state: normalizedLocation.state,
          });

          // Fix for line 114: Handle potentially undefined fullAddress
          const fullAddress =
            normalizedLocation.fullAddress || suggestion.placeName;
          onLocationSelect(
            normalizedLocation.city,
            normalizedLocation.state,
            fullAddress
          );
        }
      } catch (error) {
        console.error("Error normalizing location:", error);
      }
    }
  };

  // Handle blur - validate location
  const handleBlur = async () => {
    if (inputValue && !selectedLocation) {
      try {
        const normalizedLocation = await normalizeLocation(inputValue);
        if (
          "city" in normalizedLocation &&
          "state" in normalizedLocation &&
          normalizedLocation.city &&
          normalizedLocation.state
        ) {
          setSelectedLocation({
            city: normalizedLocation.city,
            state: normalizedLocation.state,
          });

          // Fix for line 133: Handle potentially undefined fullAddress
          if (normalizedLocation.fullAddress) {
            setInputValue(normalizedLocation.fullAddress);
          }

          // Fix for line 137: Handle potentially undefined fullAddress
          const fullAddress = normalizedLocation.fullAddress || inputValue;
          onLocationSelect(
            normalizedLocation.city,
            normalizedLocation.state,
            fullAddress
          );
        }
      } catch (error) {
        console.error("Error validating location:", error);
      }
    }

    // Hide suggestions after a short delay (allows for clicks on suggestions)
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => {
            if (inputValue.trim().length >= 2) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Enter city, state, or ZIP code"
          className={`${className} ${error ? "border-red-500" : ""}`}
          autoComplete="off"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Location Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id || index}
                className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-center"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <FaMapMarkerAlt className="text-purple-400 mr-2 flex-shrink-0" />
                <span className="text-sm">{suggestion.placeName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Display selected location info */}
      {selectedLocation && (
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <FaCheckCircle className="text-green-500 mr-2" />
          <span>
            Selected: {selectedLocation.city}, {selectedLocation.state}
          </span>
        </div>
      )}
    </div>
  );
}

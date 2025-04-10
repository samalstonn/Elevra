"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { getLocationSuggestions, normalizeLocation } from "@/lib/geocoding";
import { debounce } from "@/lib/debounce";
import { AutocompleteSuggestion } from "@/types/geocoding";
import { Loader2 } from "lucide-react";
import {
  FaMapMarkerAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

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
    fullAddress: string;
    isCompleteAddress: boolean;
  } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Check if an address appears to be a complete street address
  const isCompleteAddress = (address: string): boolean => {
    // Must have numbers (likely a street number)
    const hasNumbers = /\d/.test(address);

    // Must have at least 3 parts (e.g. "123 Main St")
    const parts = address.trim().split(/\s+/);
    const hasEnoughParts = parts.length >= 3;

    // Must include street type indicators (St, Ave, Rd, etc.) or apartment/unit indicators
    const hasStreetIndicator =
      /\b(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|ln|lane|way|pl|place|ct|court|circle|cir|trl|trail|pkwy|parkway|hwy|highway|apt|unit|suite|#)\b/i.test(
        address
      );

    return hasNumbers && hasEnoughParts && hasStreetIndicator;
  };

  const normalizeAndSelectLocation = async (
    input: string,
    fallback: string,
    updateInput: boolean = false
  ) => {
    try {
      const normalizedLocation = await normalizeLocation(input);

      if (
        "city" in normalizedLocation &&
        "state" in normalizedLocation &&
        normalizedLocation.city &&
        normalizedLocation.state &&
        normalizedLocation.fullAddress
      ) {
        const fullAddress = normalizedLocation.fullAddress || fallback;
        const addressComplete = isCompleteAddress(fullAddress);

        if (!addressComplete) {
          setValidationError(
            "Please enter a complete street address including street number and name"
          );
          return false;
        }

        setSelectedLocation({
          city: normalizedLocation.city,
          state: normalizedLocation.state,
          fullAddress: fullAddress,
          isCompleteAddress: addressComplete,
        });

        if (updateInput) {
          setInputValue(fullAddress);
        }

        setValidationError(null);
        onLocationSelect(
          normalizedLocation.city,
          normalizedLocation.state,
          fullAddress
        );
        return true;
      } else {
        setValidationError("Please enter a valid address");
        return false;
      }
    } catch (error) {
      console.error("Error normalizing location:", error);
      setValidationError("Unable to validate this address");
      return false;
    }
  };

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
    if (input.trim().length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    try {
      const results = await getLocationSuggestions(input);

      // Filter results to only include complete addresses
      const completeAddresses = results.filter((suggestion) =>
        isCompleteAddress(suggestion.placeName)
      );

      setSuggestions(completeAddresses);
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
    setValidationError(null);

    if (value.trim().length >= 3) {
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

    // Verify this is a complete address
    if (!isCompleteAddress(suggestion.placeName)) {
      setValidationError("Please select a complete street address");
      return;
    }

    if (suggestion.city && suggestion.state) {
      setSelectedLocation({
        city: suggestion.city,
        state: suggestion.state,
        fullAddress: suggestion.placeName,
        isCompleteAddress: true,
      });
      setValidationError(null);
      onLocationSelect(suggestion.city, suggestion.state, suggestion.placeName);
    } else {
      await normalizeAndSelectLocation(
        suggestion.placeName,
        suggestion.placeName
      );
    }
  };

  // Handle blur - validate location
  const handleBlur = async () => {
    if (inputValue) {
      if (!isCompleteAddress(inputValue)) {
        setValidationError(
          "Please enter a complete street address including street number and name"
        );
      } else if (!selectedLocation) {
        await normalizeAndSelectLocation(inputValue, inputValue, true);
      }
    } else {
      setValidationError("Address is required");
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
            if (inputValue.trim().length >= 3) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Enter complete street address (123 Main St, City, State)"
          className={`${className} ${
            error || validationError ? "border-red-500" : ""
          }`}
          autoComplete="off"
          style={{ width: "100%" }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {(error || validationError) && (
        <p className="text-red-500 text-xs mt-1 flex items-start">
          <FaExclamationTriangle className="mr-1 mt-0.5 flex-shrink-0" />
          <span>{error || validationError}</span>
        </p>
      )}

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
      {selectedLocation && selectedLocation.isCompleteAddress && (
        <div className="flex items-center text-sm text-gray-600 mt-1">
          <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
          <span>Address validated: {selectedLocation.fullAddress}</span>
        </div>
      )}

      {showSuggestions &&
        suggestions.length === 0 &&
        inputValue.length >= 3 &&
        !isLoading && (
          <div className="text-sm text-gray-600 mt-1 flex items-center">
            <FaExclamationTriangle className="text-amber-500 mr-2 flex-shrink-0" />
            <span>
              Please enter a complete street address with number and street name
            </span>
          </div>
        )}
    </div>
  );
}

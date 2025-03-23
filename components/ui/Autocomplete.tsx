import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AutocompleteSuggestion } from '@/types/geocoding';

interface AutocompleteProps {
  suggestions: AutocompleteSuggestion[];
  isLoading: boolean;
  visible: boolean;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
}

export default function Autocomplete({
  suggestions,
  isLoading,
  visible,
  onSelect,
  highlightedIndex,
  setHighlightedIndex
}: AutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Scroll highlighted item into view
  useEffect(() => {
    if (containerRef.current && suggestions.length > 0 && highlightedIndex >= 0) {
      const container = containerRef.current;
      const highlightedElement = container.querySelector(`[data-index="${highlightedIndex}"]`);
      
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex, suggestions.length]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute z-50 w-full bg-white rounded-b-lg shadow-lg mt-1 max-h-60 overflow-auto"
          ref={containerRef}
        >
          {isLoading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              <div className="animate-pulse flex justify-center items-center">
                <div className="h-5 w-5 bg-purple-200 rounded-full mr-2"></div>
                <div className="h-5 bg-purple-200 rounded w-24"></div>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              No matches found
            </div>
          ) : (
            <ul className="py-1" role="listbox">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  data-index={index}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={`px-4 py-2 text-sm cursor-pointer flex flex-col hover:bg-purple-50 transition-colors ${
                    highlightedIndex === index ? 'bg-purple-50' : ''
                  }`}
                  onClick={() => onSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="font-medium">{suggestion.text}</span>
                  <span className="text-gray-500 text-xs">
                    {suggestion.city && suggestion.stateName 
                      ? `${suggestion.city}, ${suggestion.stateName}`
                      : suggestion.placeName
                    }
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
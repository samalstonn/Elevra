import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import { getLocationSuggestions, normalizeLocation } from '@/lib/geocoding';
import { debounce } from '@/lib/debounce';
import Autocomplete from './ui/Autocomplete';
import ErrorPopup from './ui/ErrorPopup';
import { AutocompleteSuggestion, NormalizedLocation, GeocodingError } from '@/types/geocoding';
import { ChevronRight, Loader2 } from 'lucide-react';

interface SearchBarProps {
  onSearch: (location: NormalizedLocation) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [placeholderBase, setPlaceholderBase] = useState('Enter your ');
  const [placeholderPhrase, setPlaceholderPhrase] = useState('');
  
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const phrases = useMemo(() => ['address...', 'neighborhood...', 'city...', 'ZIP code...'], []);

  // Type-ahead placeholder animation
  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      let delay = 100; // Faster base typing speed

      if (!deleting) {
        setPlaceholderPhrase(phrases[phraseIndex].slice(0, charIndex + 1));
        charIndex++;

        // Pause when the full word is typed out
        if (charIndex === phrases[phraseIndex].length) {
          delay = 600; // Pause before starting deletion
          deleting = true;
        }
      } else {
        setPlaceholderPhrase(phrases[phraseIndex].slice(0, charIndex - 1));
        charIndex--;

        // After fully deleting, pause briefly and move to the next word
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          delay = 300; // Pause before typing the next word
        }
      }

      timeoutId = setTimeout(tick, delay);
    };

    // Start the typing effect
    timeoutId = setTimeout(tick, 100);

    return () => clearTimeout(timeoutId);
  }, [phrases]);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch location suggestions with debounce
  const fetchSuggestions = useCallback(
    debounce(async (input: string) => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      try {
        const results = await getLocationSuggestions(input);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length >= 2) {
      setIsLoading(true);
      setShowSuggestions(true);
      fetchSuggestions(value);
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
      onSearch({
        city: suggestion.city,
        state: suggestion.state,
        stateName: suggestion.stateName,
        fullAddress: suggestion.placeName
      });
    } else {
      setErrorMessage('Could not determine city and state from selection.');
      setShowError(true);
    }
  };

  // Handle search submission
  const handleSearch = async () => {
    if (searchTerm.trim() === '') {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await normalizeLocation(searchTerm);
      
      if ('message' in result) {
        // It's an error
        setErrorMessage(result.message);
        setShowError(true);
      } else {
        // Success - valid location with city and state
        onSearch(result);
      }
    } catch (error) {
      setErrorMessage('Error processing location. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      default:
        break;
    }
  };

  // Close error popup
  const handleCloseError = () => {
    setShowError(false);
  };

  // Focus on input when clicking the container
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div 
        ref={searchContainerRef}
        className="relative flex items-center shadow-lg rounded-full w-full max-w-4xl mx-auto p-2 sm:p-3"
        onClick={handleContainerClick}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 3.87 5 10 7 10s7-6.13 7-10c0-3.87-3.13-7-7-7zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7.5 12 7.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
  
        {/* Input */}
        <div className="relative flex-grow w-full">
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholderBase + placeholderPhrase}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchTerm.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            className="flex-grow px-4 py-2 text-base sm:px-6 sm:py-4 sm:text-lg border-none rounded-l-full focus:outline-none focus:ring-0"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-owns="location-suggestions"
            aria-controls="location-suggestions"
            aria-activedescendant={
              highlightedIndex >= 0 ? `suggestion-${highlightedIndex}` : undefined
            }
            disabled={isSubmitting}
          />
          
          <Autocomplete
            suggestions={suggestions}
            isLoading={isLoading}
            visible={showSuggestions}
            onSelect={handleSelectSuggestion}
            highlightedIndex={highlightedIndex}
            setHighlightedIndex={setHighlightedIndex}
          />
        </div>
  
        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSubmitting || searchTerm.trim() === ''}
          className={`flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 ${
            isSubmitting ? 'bg-purple-700' : 'bg-purple-900 hover:bg-purple-800'
          } rounded-full transition-all`}
          aria-label="Search location"
        >
          {isSubmitting ? (
            <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-spin" />
          ) : (
            <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          )}
        </button>
      </div>

      {/* Error Popup */}
      <ErrorPopup
        message={errorMessage}
        isVisible={showError}
        onClose={handleCloseError}
      />
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getLocationSuggestions, normalizeLocation } from '@/lib/geocoding';
import { debounce } from '@/lib/debounce';
import ErrorPopup from './ui/ErrorPopup';
import { AutocompleteSuggestion } from '@/types/geocoding';
import { MapPinned, Loader2, X } from 'lucide-react';

export default function AddressButton() {
  const router = useRouter();
  const pathname = usePathname();
  
  // State for location display
  const [selectedLocation, setSelectedLocation] = useState<{ city: string; state: string }>({ 
    city: '', 
    state: '' 
  });
  
  // State for dropdown and search functionality
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch location from URL on initial load
  useEffect(() => {
    const getLocationFromUrl = async () => {
      // For both results and candidate pages
      const urlParams = new URLSearchParams(window.location.search);
      const city = urlParams.get('city');
      const state = urlParams.get('state');
      const electionID = urlParams.get('electionID');
      
      if (city && state) {
        setSelectedLocation({ city, state });
      } else if (electionID) {
        // Get location info from electionID
        try {
          // Fetch the location associated with this election ID
          // Replace this with your actual API call to get election data
          const response = await fetch(`/api/elections/${electionID}`);
          const data = await response.json();
          
          if (data.city && data.state) {
            setSelectedLocation({ city: data.city, state: data.state });
          } else {
            // Fallback to default
            setSelectedLocation({ city: 'Dryden', state: 'NY' });
          }
        } catch (error) {
          console.error('Error fetching election location:', error);
          setSelectedLocation({ city: 'Dryden', state: 'NY' });
        }
      } else {
        // Default location if nothing specified
        setSelectedLocation({ city: 'Dryden', state: 'NY' });
      }
    };
    
    getLocationFromUrl();
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (isSearchMode) {
          setIsSearchMode(false);
          setSearchTerm('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchMode]);

  // Focus search input when entering search mode
  useEffect(() => {
    if (isSearchMode && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchMode]);

  const debouncedFetchSuggestions = debounce<(input: string) => Promise<void>>(
    async (input: string) => {
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
    },
    500
  );

  // Handle input changes for location search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length >= 2) {
      setIsLoading(true);
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
    
    setHighlightedIndex(-1);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.city && suggestion.state) {
      navigateToLocation(suggestion.city, suggestion.state);
      setIsSearchMode(false);
      setIsDropdownOpen(false);
    } else {
      setErrorMessage('Could not determine city and state from selection.');
      setShowError(true);
    }
  };

  // Handle search submission
  const handleSearchSubmit = async () => {
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
        navigateToLocation(result.city, result.state);
        setIsSearchMode(false);
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.log(error)
      setErrorMessage('Error processing location. Please try again.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setIsSearchMode(false);
        setSearchTerm('');
        break;
      default:
        break;
    }
  };

  // Navigate to new location - always redirect to results page
  const navigateToLocation = (city: string, state: string) => {
    
    // Create a new params object with only the parameters we want to keep
    const newParams = new URLSearchParams();
    
    // Always include city and state
    newParams.set('city', city);
    newParams.set('state', state);
    
    // Always redirect to results page
    const newUrl = `/results?${newParams.toString()}`;
    
    // Update selected location state and navigate
    setSelectedLocation({ city, state });
    router.push(newUrl);
  };

  // Handle search mode toggle
  const handleToggleSearchMode = () => {
    setIsSearchMode(true);
  };

  // Close error popup
  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Button that shows current location */}
      <Button
        variant="ghost"
        className="items-center text-gray-700 border border-gray-300 rounded-full shadow-sm"
        onClick={() => setIsDropdownOpen(prev => !prev)}
      >
        <MapPinned className="w-4 h-4 mr-1" />
        <span className="mr-1 truncate max-w-[150px]">
          {selectedLocation.city}, {selectedLocation.state}
        </span>
      </Button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white shadow-md rounded-lg z-10">
          {!isSearchMode ? (
            <>
              {/* Search option */}
              <div className="border-t border-gray-200 p-2">
                <button
                  onClick={handleToggleSearchMode}
                  className="block w-full text-left px-4 py-2 text-sm rounded-lg text-purple-600 hover:bg-gray-100"
                >
                  Search for a location...
                </button>
              </div>
            </>
          ) : (
            /* Search input mode */
            <div className="p-2">
              <div className="flex items-center border rounded-md focus-within:ring-1 focus-within:ring-purple-500">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Enter city, state, or ZIP..."
                  value={searchTerm}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="border-none flex-grow focus:ring-0 text-sm"
                  disabled={isSubmitting}
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={handleSearchSubmit}
                  disabled={isSubmitting || searchTerm.trim() === ''}
                  className="p-2 text-purple-600 disabled:text-gray-400"
                >
                  {isSubmitting && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </button>
              </div>

              {/* Location suggestions */}
              {suggestions.length > 0 && (
                <div className="mt-2 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        index === highlightedIndex
                          ? "bg-purple-100 text-purple-800"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      onClick={() => handleSelectSuggestion(suggestion)}
                      id={`suggestion-${index}`}
                    >
                      {suggestion.placeName}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-center p-2">
                  <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                </div>
              )}

              {/* No results message */}
              {!isLoading && searchTerm.trim().length >= 2 && suggestions.length === 0 && (
                <div className="p-4 text-sm text-gray-500 text-center">
                  No locations found. Try a different search.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error Popup */}
      <ErrorPopup
        message={errorMessage}
        isVisible={showError}
        onClose={handleCloseError}
      />
    </div>
  );
}
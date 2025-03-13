import { useState, useEffect, useMemo } from 'react';
import { Input } from './ui/input';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  const phrases = useMemo(() => ['address...', 'neighborhood...', 'city...', 'ZIP code...'], []);

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    const baseText = 'Enter your ';
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      let delay = 100; // Faster base typing speed (100ms per character)

      if (!deleting) {
        setPlaceholder(baseText + phrases[phraseIndex].slice(0, charIndex + 1));
        charIndex++;

        // Pause when the full word is typed out
        if (charIndex === phrases[phraseIndex].length) {
          delay = 600; // Pause for 600ms before starting deletion
          deleting = true;
        }
      } else {
        setPlaceholder(baseText + phrases[phraseIndex].slice(0, charIndex - 1));
        charIndex--;

        // After fully deleting, pause briefly and move to the next word
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          delay = 300; // Pause for 300ms before typing the next word
        }
      }

      timeoutId = setTimeout(tick, delay);
    };

    // Start the typing effect
    timeoutId = setTimeout(tick, 100);

    return () => clearTimeout(timeoutId);
  }, [phrases]);

  const handleSearch = () => {
    if (searchTerm.trim() !== '') {
      onSearch(searchTerm);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="flex items-center shadow-lg rounded-full w-full max-w-4xl mx-auto p-2 sm:p-3">
        {/* Icon */}
        <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 sm:w-7 sm:h-7" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 3.87 5 10 7 10s7-6.13 7-10c0-3.87-3.13-7-7-7zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7.5 12 7.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
  
        {/* Input */}
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="flex-grow px-4 py-2 text-base sm:px-6 sm:py-4 sm:text-lg border-none rounded-l-full focus:outline-none focus:ring-0"
        />
  
        {/* Search Button */}
        <button
          onClick={handleSearch}
          className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 bg-purple-900 rounded-full hover:bg-purple-800 transition-all"
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='w-6 h-6 sm:w-7 sm:h-7 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
          </svg>
        </button>
      </div>
    </div>
  );
}
import { useState, useEffect, SetStateAction, useMemo } from 'react';
import { Input } from './ui';

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

    const interval = setInterval(() => {
      if (!deleting) {
        setPlaceholder(baseText + phrases[phraseIndex].slice(0, charIndex + 1));
        charIndex++;
        if (charIndex === phrases[phraseIndex].length) {
          deleting = true;
        }
      } else {
        setPlaceholder(baseText + phrases[phraseIndex].slice(0, charIndex - 1));
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phrases]);

  const handleSearch = () => {
    if (onSearch) onSearch(searchTerm);
  };

  return (
    <div className="flex items-center shadow-md rounded-full w-full">
      <div className="flex items-center justify-center w-12 h-12 text-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 3.87 5 10 7 10s7-6.13 7-10c0-3.87-3.13-7-7-7zm0 10.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 7.5 12 7.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
        </svg>
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e: { target: { value: SetStateAction<string>; }; }) => setSearchTerm(e.target.value)}
        className="flex-grow px-4 py-2 text-gray-700 border-none rounded-l-full focus:outline-none focus:ring-0"
      />
      <button
        onClick={handleSearch}
        className="flex items-center justify-center w-10 h-10 bg-purple-900 rounded-full hover:bg-purple-800"
      >
        <svg xmlns='http://www.w3.org/2000/svg' className='w-5 h-6 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
        </svg>
      </button>
    </div>
  );
}

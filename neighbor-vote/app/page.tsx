'use client';

import React, { useState, useEffect } from 'react';
import ZipCodeInput from './components/ZipCodeInput';
import ResultsSection from './components/ResultsSection';
import { election_data } from './lib/models'; 

export default function Home() {
  const [zipCode, setZipCode] = useState('');
  const [elections, setElections] = useState<election_data[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = (zip: string) => {
    setZipCode(zip);
  };

  useEffect(() => {
    if (zipCode) {
      const fetchElections = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/elections?zipCode=${zipCode}`);
          const data = await response.json();
          setElections(data);
        } catch (error) {
          console.error('Failed to fetch elections:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchElections();
    }
  }, [zipCode]);

  return (
    <main className="flex flex-col items-center w-full max-w-4xl mt-6">
      <ZipCodeInput onSearch={handleSearch} />
      {zipCode && (
        <>
          {loading ? (
            <p>Loading elections...</p>
          ) : (
            <ResultsSection zipCode={zipCode} elections={elections} />
          )}
        </>
      )}
    </main>
  );
}

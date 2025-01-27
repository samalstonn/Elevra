"use client";

import { useState } from 'react';
import { Button, Input } from '../components/ui';
import SearchBar from '../components/SearchBar';

export default function HomePage() {
  const [query, setQuery] = useState('');

  const handleQueryChange = (e) => setQuery(e.target.value);

  return (
    <div className="min-h-screen flex flex-col items-center px-6 mx-auto">

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center py-16 space-y-6">
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 w-full">Engage with your community. <br /> Seamlessly contribute.</h1>

        {/* Input Section */}
        <div className="flex items-center w-[600px] h-[60px]">
        <SearchBar onSearch={(zipCode: any) => console.log(zipCode)} />
        </div>
      </main>

      
    </div>
  );
}

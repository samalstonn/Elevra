"use client";

import SearchBar from '../components/SearchBar';
import FeatureCards from '../components/FeatureCards';
import TrendingProjects from '../components/TrendingProjects';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8 mx-auto">

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center py-16 sm:py-20 space-y-6 w-full">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 w-full">
          Engage with your community. <br /> Seamlessly contribute.
        </h1>

        {/* Input Section */}
        <div className="w-full max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl py-6">
          <SearchBar onSearch={(zipCode: string) => console.log(zipCode)} />
        </div>

        {/* Trending Projects */}
        <div className="w-full max-w-6xl sm:max-w-7xl xl:max-w-[80%] px-4">
          <TrendingProjects />
        </div>

        {/* Feature Cards */}
        <div className="w-full max-w-6xl sm:max-w-7xl xl:max-w-[80%] px-4">
          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
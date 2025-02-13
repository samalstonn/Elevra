"use client";

import TrendingProjects from '../components/TrendingProjects';
import SearchBar from '../components/SearchBar';
import FeatureCards from '../components/FeatureCards';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (zipCode: string) => {
    router.push(`/dashboard?zipCode=${zipCode}`);
  };
  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8 mx-auto">

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center py-12 sm:py-20 space-y-4 sm:space-y-6 w-full">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 w-full leading-tight">
          Engage with your community. <br /> Seamlessly contribute.
        </h1>

        {/* Input Section */}
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl py-4 sm:py-6">
          <SearchBar onSearch={(zipCode: string) => handleSearch(zipCode)} />
        </div>

        {/* Trending Projects */}
        <div className="w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl xl:max-w-[80%] px-2 sm:px-4">
          <TrendingProjects />
        </div>

        {/* Feature Cards */}
        <div className="w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl xl:max-w-[80%] px-2 sm:px-4">
          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
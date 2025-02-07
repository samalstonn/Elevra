"use client";

import SearchBar from '../components/SearchBar';
import FeatureCards from '../components/FeatureCards';
import TrendingProjects from '../components/TrendingProjects';

export default function HomePage() {


  return (
    <div className="min-h-screen flex flex-col items-center px-6 mx-auto">

      {/* Hero Section */}
      <main className="flex flex-col items-center text-center py-32 space-y-6">
        <h1 className="text-6xl font-extrabold tracking-tight text-gray-900 w-full">Engage with your community. <br /> Seamlessly contribute.</h1>

        {/* Input Section */}
        <div className="flex items-center w-[600px] h-[60px] py-16">
        <SearchBar onSearch={(zipCode: string) => console.log(zipCode)} />
        </div>
        <div className="flex items-center w-[65%] ">
        <TrendingProjects />
        </div>
      
        <div className="flex items-center w-[65%] ">
        <FeatureCards />
        </div>

      </main>
    </div>
  );
}
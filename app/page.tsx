"use client";

import { motion } from "framer-motion";
import TrendingProjects from "../components/TrendingProjects";
import SearchBar from "../components/SearchBar";
import FeatureCards from "../components/FeatureCards";
import { useRouter } from "next/navigation";
import AboutUs from "@/components/AboutUs";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (zipCode: string) => {
    router.push(`/results?zipCode=${zipCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-6 lg:px-8 mx-auto">
      
      {/* Hero Section */}
      <motion.main 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex flex-col items-center text-center py-12 sm:py-20 space-y-4 sm:space-y-6 w-full"
      >
        <div className="h-36"></div> 
        
        {/* Big "Elevra" Header */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-purple-900"
        >
          Elevra
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
          className="text-1xl sm:text-3xl md:text-4xl tracking-tight text-gray-900 w-full leading-tight"
        >
          Engage with your community. Seamlessly contribute.
        </motion.h2>

        {/* Search Bar with Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          viewport={{ once: true }}
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl py-6"
        >
          <SearchBar onSearch={(zipCode: string) => handleSearch(zipCode)} />
        </motion.div>
      </motion.main>

      {/* Add Extra White Space */}
      <div className="h-28"></div> 

      {/* About Us Section */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="w-full"
      >
        <AboutUs />
      </motion.div>

      {/* Feature Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl xl:max-w-[80%] px-2 sm:px-4"
      >
        <FeatureCards />
      </motion.div>
    </div>
  );
}
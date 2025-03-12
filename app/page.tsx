"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "../components/SearchBar";
import FeatureCards from "../components/FeatureCards";
import AboutUs from "@/components/AboutUs";

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();


  const handleSearch = (zipCode: string) => {
    router.push(`/results?zipCode=${zipCode}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center w-full overflow-x-hidden mx-auto">
      
      {/* Hero Section */}
      <motion.main 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 }
          }
        }}
        className="flex flex-col items-center text-center py-12 sm:py-20 space-y-4 sm:space-y-6 w-full max-w-screen"
      >
        <div className="h-20"></div> 
        
        {/* Animated "Elevra" Header */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 20, rotate: -2 },
            visible: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.6, ease: "easeOut" } }
          }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-purple-900"
        >
          Elevra
        </motion.h1>

        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
          }}
          className="text-1xl sm:text-3xl md:text-4xl tracking-tight text-gray-900 w-full leading-tight"
        >
          Discover and Support Local Candidates in Seconds.
        </motion.h2>

        {/* Search Bar */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.9 },
            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
          }}
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl py-6"
        >
          <SearchBar onSearch={(zipCode: string) => handleSearch(zipCode)} />
        </motion.div>
      </motion.main>

      <div className="mt-4 sm:mt-8 lg:mt-8"></div>

      {/* About Us Section */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true }}
        className="w-full max-w-screen"
      >
        <AboutUs />
      </motion.div>

      {/* Feature Cards Section */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl xl:max-w-[80%] px-2 sm:px-4"
      >
        <FeatureCards />
      </motion.div>

      <motion.h2
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
          }}
          className="text-1xl sm:text-3xl md:text-4xl tracking-tight text-gray-900 w-full leading-tight text-center mt-12"
        >
          Discover and Support Local Candidates in Seconds.
        </motion.h2>

      {/* Search Bar */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 30, scale: 0.9 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: "easeOut" } }
        }}
        className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl py-6 mb-24"
      >
        <SearchBar onSearch={(zipCode: string) => handleSearch(zipCode)} />
      </motion.div>
      
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
    </div>
  );
}
"use client";

import { motion } from "framer-motion";
import SearchBar from "../components/SearchBar";
import FeatureCards from "../components/FeatureCards";
import { useRouter } from "next/navigation";
import AboutUs from "@/components/AboutUs";

export default function HomePage() {
  const router = useRouter();

  const handleSearch = (zipCode: string) => {
    router.push(`/results?zipCode=${zipCode}`);
  };

  // Motion variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: "easeOut",
        staggerChildren: 0.2, // Delays each child slightly
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20, rotate: -2 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotate: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center w-full overflow-x-hidden mx-auto">
      
      {/* Hero Section */}
      <motion.main 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="flex flex-col items-center text-center py-12 sm:py-20 space-y-4 sm:space-y-6 w-full max-w-screen"
      >
        <div className="h-24"></div> 
        
        {/* Animated "Elevra" Header */}
        <motion.h1
          variants={textVariants}
          className="text-6xl sm:text-6xl md:text-7xl font-bold text-purple-900"
        >
          Elevra
        </motion.h1>

        <motion.h2
          variants={textVariants}
          className="text-1xl sm:text-3xl md:text-4xl tracking-tight text-gray-900 w-full leading-tight"
        >
          Discover and Support Local Candidates in Seconds.
        </motion.h2>

        {/* Search Bar */}
        <motion.div
          variants={cardVariants}
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl py-6"
        >
          <SearchBar onSearch={(zipCode: string) => handleSearch(zipCode)} />
        </motion.div>
      </motion.main>

      <div className="mt-8 sm:mt-16 lg:mt-24"></div>

      {/* About Us Section */}
      <motion.div 
        initial="hidden" 
        whileInView="visible" 
        variants={cardVariants}
        viewport={{ once: true }}
        className="w-full max-w-screen"
      >
        <AboutUs />
      </motion.div>

      {/* Feature Cards Section with Staggered Animation */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1, 
            transition: { staggerChildren: 0.2 } // Stagger effect
          }
        }}
        viewport={{ once: true }}
        className="w-full max-w-4xl sm:max-w-6xl lg:max-w-7xl xl:max-w-[80%] px-2 sm:px-4"
      >
        <FeatureCards />
      </motion.div>
    </div>
  );
}
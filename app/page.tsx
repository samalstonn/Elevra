"use client";

import { motion } from "framer-motion";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import SearchBar from "../components/SearchBar";
import Showcase from "../components/Showcase";
import FeatureCards from "../components/FeatureCards";
import AboutUs from "@/components/AboutUs";
import { Button } from "@/components/ui/button";
import { NormalizedLocation } from "@/types/geocoding";
import LiveElectionBanner from "@/components/LiveElectionBanner";

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const router = useRouter();

  const handleSearch = (location: NormalizedLocation) => {
    router.push(
      `/results?city=${encodeURIComponent(
        location.city
      )}&state=${encodeURIComponent(location.stateName)}`
    );
  };

  return (
    <div className="flex flex-col items-center w-full mx-auto">
      {/* Hero Section */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: "easeOut",
              staggerChildren: 0.2,
            },
          },
        }}
        className="flex flex-col items-center text-center py-10 w-full max-w-screen mt-4"
      >
        {/* Animated "Elevra" Header */}
        <motion.h1
          variants={{
            hidden: { opacity: 0, y: 20, rotate: -2 },
            visible: {
              opacity: 1,
              y: 0,
              rotate: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="text-4xl sm:text-6xl md:text-7xl font-bold text-purple-800 mb-4"
        >
          Elevra
        </motion.h1>

        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="text-1xl sm:text-3xl md:text-4xl tracking-tight text-gray-900 w-full leading-tight mb-8"
        >
          Local Elections, Simplified.
        </motion.h2>

        {/* Search Bar */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mb-12"
        >
          <SearchBar
            onSearch={(location: NormalizedLocation) => handleSearch(location)}
          />
          {/* <Button variant="purple" className="mt-4 mx-auto" asChild>
            <a href="/live-elections">Check Out What&apos;s Live</a>
          </Button> */}
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="text-center text-gray-700 flex justify-center items-center mb-2"
        >
          <span className="italic">If you are a candidate, click below</span>
        </motion.div>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.9 },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="flex justify-center items-center mb-16"
        >
          <Button variant="purple" asChild>
            <a href="/candidates">Launch Your Campaign</a>
          </Button>
        </motion.div>
        <LiveElectionBanner className="z-10" />
      </motion.main>
      {/* Live Elections Banner (below site header, above main content) */}

      {/* Showcase Section - Added here */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full self-stretch"
      >
        <Showcase />
      </motion.div>

      {/* About Us Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <AboutUs />
      </motion.div>

      {/* Feature Cards Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="w-full self-stretch"
      >
        <FeatureCards />
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: { opacity: 0, y: 30, scale: 0.9 },
          visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.6, ease: "easeOut" },
          },
        }}
      ></motion.div>
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

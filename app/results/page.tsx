"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent } from "../../components/Card";
import { Button } from "../../components/ui";
import { Search, Filter } from "lucide-react";
import { candidates } from "../../data/test_data";

export default function ElectionResults() {
  const searchParams = useSearchParams();
  const zipCode = searchParams.get("zipcode") || "13053"; // Placeholder ZIP code

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="p-8 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-gray-900"
      >
        Meet the Candidates
      </motion.h1>

      {/* Display ZIP Code */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-center text-gray-600 mt-2"
      >
        Showing results for ZIP Code: <span className="font-semibold text-gray-900">{zipCode}</span>
      </motion.p>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mt-8 flex items-center bg-white border border-gray-300 p-4 rounded-full shadow-lg"
      >
        <Search className="text-gray-500 mr-3 w-6 h-6" />
        <input
          type="text"
          placeholder="Search candidates by name, position, or district"
          className="w-full border-none outline-none text-lg text-gray-700 placeholder-gray-500"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        viewport={{ once: true }}
        className="flex flex-wrap justify-center gap-4 mt-6"
      >
        {["Position", "Party", "Location", "Incumbent", "Challenger"].map((filter, index) => (
          <Button
            key={index}
            variant="outline"
            className="flex items-center gap-2 border-gray-400 text-gray-700 hover:bg-purple-600 hover:text-white transition-all"
          >
            <Filter size={16} />
            {filter}
          </Button>
        ))}
      </motion.div>

      {/* Candidate Cards Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {candidates.map((candidate, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Link href={`/candidate/${candidate.name.replace(/\s+/g, "-").toLowerCase()}`}>
              <Card className="group hover:shadow-2xl transition-all rounded-xl cursor-pointer h-[400px] flex flex-col shadow-lg">
                <CardContent className="p-6 text-center flex flex-col items-center flex-grow">
                  <img
                    src={candidate.photo}
                    alt={`${candidate.name}'s photo`}
                    className="w-24 h-24 rounded-full mb-4 object-cover aspect-square shadow-xl"
                  />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {candidate.name}
                  </h2>
                  <p className="text-gray-600 mt-2">{candidate.position}</p>
                  <p className="text-gray-500 mt-2 text-sm line-clamp-3">
                    {candidate.bio}
                  </p>
                  <div className="mt-auto">
                    <Button className="mt-4 bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
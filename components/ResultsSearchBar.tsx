"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

export default function SearchBar({ placeholder = "Search..." }) {
  return (
    <motion.div
      className="flex items-center bg-white border border-gray-300 px-3 py-2 rounded-full shadow-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.3 } }}
    >
      <Search className="text-gray-500 mr-2 w-5 h-5" />
      <input
        type="text"
        className="outline-none w-full text-sm text-gray-700 placeholder-gray-400"
        placeholder={placeholder}
      />
    </motion.div>
  );
}
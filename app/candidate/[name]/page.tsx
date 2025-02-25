"use client";

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaDonate, FaTimes } from "react-icons/fa";
import { candidates } from "../../../data/test_data";

export default function CandidatePage() {
  const { name } = useParams();
  const [popupMessage, setPopupMessage] = useState<string | null>(null); 
  
  if (typeof name !== 'string') {
    return notFound();
  }
  const decodedName = decodeURIComponent(name).replace(/-/g, " "); // Convert URL format back to full name

  const candidate = candidates.find((c) => c.name.toLowerCase() === decodedName.toLowerCase());

  if (!candidate) {
    return notFound(); // Show 404 if candidate is not found
  }
  console.log(candidate.photo);

  const handleMissingLink = (platform: string) => {
    setPopupMessage(`${candidate.name} has not provided a ${platform} link.`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="p-8 max-w-4xl mx-auto bg-white rounded-lg shadow-lg relative"
    >
      {/* Candidate Profile Header */}
      <div className="flex flex-col items-center text-center">
        <Image
          src={candidate.photo}
          alt={candidate.name}
          width={160} // Adjust as needed
          height={200} // Adjust as needed
          className="rounded-full shadow-lg object-cover aspect-square"
        />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">{candidate.name}</h1>
        <p className="text-lg text-gray-600">{candidate.position}</p>
        <p className="mt-2 text-gray-700 max-w-md">{candidate.bio}</p>
      </div>

      {/* Social & Website Links */}
      <div className="mt-6 flex justify-center gap-4">
        {candidate.website ? (
          <a href={candidate.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
            <FaGlobe size={24} />
          </a>
        ) : (
          <span onClick={() => handleMissingLink("website")} className="text-gray-400 cursor-pointer">
            <FaGlobe size={24} />
          </span>
        )}

        {candidate.linkedin ? (
          <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900">
            <FaLinkedin size={24} />
          </a>
        ) : (
          <span onClick={() => handleMissingLink("LinkedIn")} className="text-gray-400 cursor-pointer">
            <FaLinkedin size={24} />
          </span>
        )}

        {candidate.twitter ? (
          <a href={candidate.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
            <FaTwitter size={24} />
          </a>
        ) : (
          <span onClick={() => handleMissingLink("Twitter")} className="text-gray-400 cursor-pointer">
            <FaTwitter size={24} />
          </span>
        )}
      </div>

      {/* Candidate Policies */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-gray-900">Policies</h2>
        <ul className="mt-3 space-y-2">
          {candidate.policies.map((policy, index) => (
            <li key={index} className="text-gray-700 flex items-center gap-2">✅ {policy}</li>
          ))}
        </ul>
      </div>

      {/* Donate Button */}
      <div className="mt-8 flex justify-center">
        <a
          href={candidate.donationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 text-lg font-semibold shadow-md hover:bg-green-600 transition"
        >
          <FaDonate />
          Donate to {candidate.name}
        </a>
      </div>

      {/* Improved Popup Message */}
      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <span>{popupMessage}</span>
            <button onClick={() => setPopupMessage(null)} className="text-white hover:text-gray-200">
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
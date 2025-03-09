"use client";

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaDonate, FaCheckCircle } from "react-icons/fa";
import { candidates } from "../../../data/test_data";

function normalizeSlug(str: string): string {
  return str.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, "-").trim();
}

export default function CandidatePage() {
  const { name } = useParams();
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  if (typeof name !== "string") {
    return notFound();
  }

  const decodedName = normalizeSlug(decodeURIComponent(name));
  const candidate = candidates.find(
    (c) => normalizeSlug(c.name) === decodedName
  );

  if (!candidate) {
    return notFound();
  }


  const formattedPolicies = candidate.policies.map((policy) => {
    if (typeof policy === "string") {
      const [title, ...descriptionParts] = policy.split(":");
      return {
        title: title.trim(),
        description: descriptionParts.join(":").trim(),
      };
    }
    return policy;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="p-4 sm:p-6 max-w-6xl mx-auto bg-white relative"
    >
      {/* Profile Header */}
      <div className="flex flex-col items-start text-left">
        <Image
          src={candidate.photo || '/default-profile.png'}
          width={100}
          height={100}
          alt={candidate.name}
          className="rounded-full shadow-sm"
        />
        <h1 className="mt-2 text-xl font-bold text-gray-900 flex items-center gap-2 relative">
          {candidate.name}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setHovered(candidate.name)}
            onMouseLeave={() => setHovered(null)}
          >
            {candidate.verified ? (
              <FaCheckCircle className="text-blue-500" />
            ) : (
              <FaCheckCircle className="text-gray-400" />
            )}
            {hovered === candidate.name && (
              <div
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-10"
              >
                {candidate.verified
                  ? "This candidate has verified their information"
                  : "This candidate has not verified their information"}
              </div>
            )}
          </div>
        </h1>
        <p className="text-sm font-medium text-gray-600">{candidate.position}</p>
        <p className="text-sm font-semibold text-blue-600">{candidate.politicalAffiliation}</p>
      </div>
  
      {/* Social Links Inline */}
      <div className="mt-2 flex items-start gap-3">
        {(
          <a href={candidate.website} target="_blank" className="text-blue-600 hover:text-blue-800 text-lg">
        <FaGlobe />
          </a>
        )}
        {(
          <a href={candidate.linkedin} className="text-blue-600 hover:text-blue-800 text-xl">
        <FaLinkedin />
          </a>
        )}
        {(
          <a href={candidate.twitter} className="text-blue-400 hover:text-blue-600 text-xl">
        <FaTwitter />
          </a>
        )}
      </div>
  
      {/* Candidate Bio */}
      <p className="mt-4 text-sm text-gray-700">{candidate.bio}</p>
  
      {/* Policies */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
        <ul className="space-y-1 text-sm">
          {formattedPolicies.map((policy, index) => (
            <li key={index}>
              <span className="font-semibold">✅ {policy.title}{policy.description ? ":" : ""}</span> {policy.description}
            </li>
          ))}
        </ul>
      </div>
  
      {/* Additional Notes (if present) */}
      {candidate.additionalNotes && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
          <p className="text-sm">{candidate.additionalNotes}</p>
        </div>
      )}
  
      {/* Buttons Inline */}
      <div className="mt-4 flex justify-center gap-4">
        {(
          <a
        href={candidate.donationLink}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 transition flex items-center gap-2"
          >
        <FaDonate />
        <span>Donate</span>
          </a>
        )}
        <button
          onClick={() => { /* placeholder function */ }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <FaCheckCircle />
          <span>This is me</span>
        </button>
      </div>
  
      {/* Popup Message */}
      {popupMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded shadow-md">
          {popupMessage}
          <button className="ml-2" onClick={() => setPopupMessage(null)}>✕</button>
        </div>
      )}
    </motion.div>
  );
}
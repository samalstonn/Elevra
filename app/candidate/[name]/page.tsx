"use client";

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaDonate, FaTimes, FaCheckCircle } from "react-icons/fa";
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

  const handleMissingLink = (platform: string) => {
    setPopupMessage(`${candidate.name} has not provided a ${platform} link.`);
  };

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
      className="p-6 sm:p-8 pb-8 mb-16 max-w-3xl mx-auto bg-white rounded-lg shadow-xl border border-gray-200 relative"
    >
      {/* Candidate Profile */}
      <div className="flex flex-col items-center text-center">
      <Image
          src={candidate.photo || "/default-profile.png"}
          alt={candidate.name}
          width={180}
          height={180}
          className="rounded-full shadow-lg object-cover border-4 border-gray-300"
        />

        {/* Candidate Name + Verified Badge */}
        <div className="mt-3 flex items-center gap-2 relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{candidate.name}</h1>

          {/* Verified or Unverified Icon */}
          <div
            className="relative cursor-pointer"
            onMouseEnter={() => setHovered(candidate.name)}
            onMouseLeave={() => setHovered(null)}
          >
            {candidate.verified ? (
              <FaCheckCircle className="text-green-500 text-lg" />
            ) : (
              <FaCheckCircle className="text-gray-400 text-lg" />
            )}

            {/* Tooltip Popup */}
            {hovered === candidate.name && (
              <div className="absolute top-[-32px] left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white text-xs font-medium border border-blue-400 rounded-md px-3 py-2 shadow-lg whitespace-nowrap">
                {candidate.verified
                  ? "This candidate has verified their information"
                  : "This candidate has not yet verified their information"}
              </div>
            )}
          </div>
        </div>

        <p className="text-md sm:text-lg font-medium text-gray-600">{candidate.position}</p>
        <p className="text-md font-semibold text-blue-600 mt-1">{candidate.politicalAffiliation}</p>
        <p className="mt-2 text-gray-700 max-w-lg text-sm sm:text-base">{candidate.bio}</p>
      </div>

      {/* Social Links */}
      <div className="mt-6 flex justify-center gap-6 sm:gap-4">
        {candidate.website ? (
          <a
            href={candidate.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 transition text-xl sm:text-2xl"
          >
            <FaGlobe />
          </a>
        ) : (
          <span
            onClick={() => handleMissingLink("website")}
            className="text-gray-400 cursor-pointer text-xl sm:text-2xl"
          >
            <FaGlobe />
          </span>
        )}

        {candidate.linkedin ? (
          <a
            href={candidate.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:text-blue-900 transition text-xl sm:text-2xl"
          >
            <FaLinkedin />
          </a>
        ) : (
          <span
            onClick={() => handleMissingLink("LinkedIn")}
            className="text-gray-400 cursor-pointer text-xl sm:text-2xl"
          >
            <FaLinkedin />
          </span>
        )}

        {candidate.twitter ? (
          <a
            href={candidate.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 transition text-xl sm:text-2xl"
          >
            <FaTwitter />
          </a>
        ) : (
          <span
            onClick={() => handleMissingLink("Twitter")}
            className="text-gray-400 cursor-pointer text-xl sm:text-2xl"
          >
            <FaTwitter />
          </span>
        )}
      </div>

      {/* Candidate Policies */}
      <div className="mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Policies</h2>
        <ul className="mt-3 space-y-2">
          {formattedPolicies.map((policy, index) => (
            <li key={index} className="flex items-start text-gray-800 text-sm sm:text-base gap-2">
              <div>
                <span className="font-semibold">✅ {policy.title}{policy.description ? ":" : ""}</span> {policy.description}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Additional Notes */}
      {candidate.additionalNotes && (
        <div className="mt-8">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Additional Notes</h2>
          <p className="mt-3 text-gray-800 text-sm sm:text-base font-medium">
            {candidate.additionalNotes}
          </p>
        </div>
      )}

      {/* Donate Button */}
      {candidate.donationLink && (
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
      )}

      {/* Popup Message */}
      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 text-sm sm:text-base"
          >
            <span>{popupMessage}</span>
            <button
              onClick={() => setPopupMessage(null)}
              className="text-white hover:text-gray-200"
            >
              <FaTimes />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
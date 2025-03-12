"use client";

import { useParams, notFound, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaCheckCircle } from "react-icons/fa";
import { candidates } from "../../../data/test_data";
import CheckoutButton from "@/components/DonateButton";

function normalizeSlug(str: string): string {
  return str.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, "-").trim();
}

export default function CandidatePage() {
  const { name } = useParams();
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const searchParams = useSearchParams();


  const decodedName = name ? normalizeSlug(decodeURIComponent(Array.isArray(name) ? name[0] : name)) : "";
  const candidate = candidates.find(
    (c) => normalizeSlug(c.name) === decodedName
  );
  
  useEffect(() => {
    if (!candidate) return;
    const candidateName = candidate.name;
    if (searchParams.get('session_id')) {
      setPopupMessage({ type: 'success', message: `Your donation to ${candidateName} was successful! Thank you for your support!` });
      const url = new URL(window.location.href);
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.toString());
    } else if (searchParams.get('cancel')) {
      setPopupMessage({ type: 'error', message: `Your donation to ${candidateName} was cancelled.` });
      const url = new URL(window.location.href);
      url.searchParams.delete('cancel');
      window.history.replaceState({}, '', url.toString());
    } else if (searchParams.get('error')) {
      setPopupMessage({ type: 'error', message: `There was an error processing your donation. Please try again.` });
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, candidate]);


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
        <CheckoutButton
          cartItems={[
            {
              name: `Donation to ${candidate.name}'s Campaign`,
              price: 10,     // Price in USD
              quantity: 1,
            },
          ]}
        />
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
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 ${popupMessage.type === 'success' ? 'bg-purple-600' : 'bg-red-500'} text-white text-center px-4 py-2 rounded-3xl shadow-md`}>
          {popupMessage.message}
          <button className="ml-2" onClick={() => setPopupMessage(null)}>✕</button>
        </div>
      )}
    </motion.div>
  );
}
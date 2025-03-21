"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaCheckCircle, FaUserPlus, FaChevronUp, FaQuestionCircle } from "react-icons/fa";
import CheckoutButton from "@/components/DonateButton";
import { Button } from "../../../components/ui/button";
import { Candidate, Election } from "@prisma/client";
import { cityStateToZip } from "@/data/test_data";
import { normalizeSlug } from "@/lib/functions";

type ElectionWithCandidates = Election & { candidates: Candidate[] };


export default function CandidateClient({ candidate, election, suggestedCandidates }: { candidate: Candidate; election: ElectionWithCandidates; suggestedCandidates: Candidate[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [popupMessage, setPopupMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const decodedName = candidate.name ? normalizeSlug(candidate.name) : "";
  const relatedCandidates = election.candidates
    ? election.candidates.filter((c: Candidate) =>
            normalizeSlug(c.name) !== decodedName
        ).slice(0, 3)
    : [];

  const randomSuggestedCandidates = useMemo(() => {
    const shuffled = [...suggestedCandidates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [suggestedCandidates]);


  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!candidate) return;
    const candidateName = candidate.name;
    if (searchParams.get("session_id")) {
      setPopupMessage({ type: "success", message: `Your donation to ${candidateName} was successful! Thank you for your support!` });
      const url = new URL(window.location.href);
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());
    } else if (searchParams.get("cancel")) {
      setPopupMessage({ type: "error", message: `Your donation to ${candidateName} was cancelled.` });
      const url = new URL(window.location.href);
      url.searchParams.delete("cancel");
      window.history.replaceState({}, "", url.toString());
    } else if (searchParams.get("error")) {
      setPopupMessage({ type: "error", message: `There was an error processing your donation. Please try again.` });
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, candidate]);

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  if (!hydrated) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="container mx-auto px-4 flex flex-col md:flex-row gap-6 mb-16"
    >
      {/* Main candidate profile card */}
      <motion.div className="w-full md:w-2/3 flex flex-col sm:p-6 bg-white">
        {/* Profile Header */}
        <div className="flex flex-col items-start text-left">
          <Image
            src={candidate.photo || "/default-profile.png"}
            width={150}
            height={150}
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
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                  {candidate.verified
                    ? "This candidate has verified their information"
                    : "This candidate has not verified their information"}
                </div>
              )}
            </div>
          </h1>
          <p className="text-sm font-medium text-gray-600">{candidate.position}</p>
          <p className="text-sm font-semibold text-purple-600">{candidate.party}</p>
        </div>
    
        {/* Social Links Inline */}
        <div className="mt-2 flex items-start gap-3">
          {candidate.website && (
            <a href={candidate.website} target="_blank" className="text-blue-600 hover:text-blue-800 text-lg">
              <FaGlobe />
            </a>
          )}
          {candidate.linkedin && (
            <a href={candidate.linkedin} className="text-blue-600 hover:text-blue-800 text-xl">
              <FaLinkedin />
            </a>
          )}
          {candidate.twitter && (
            <a href={candidate.twitter} className="text-blue-400 hover:text-blue-600 text-xl">
              <FaTwitter />
            </a>
          )}
        </div>
    
        {/* Candidate Bio */}
        <div className="mt-4 text-sm text-gray-700">
          <p>{candidate.bio}</p>
        </div>
    
        {/* Policies */}
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
          <ul className="space-y-1 text-sm">
            {(candidate.policies).map((policy: string, index: number) => (
              <li key={index}>
                <span className="font-semibold">✅ {policy}</span>
              </li>
            ))}
          </ul>
        </div>
    
        {/* Additional Notes */}
        {candidate.additionalNotes && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-gray-900">Additional Notes</h2>
            <p className="text-sm">{candidate.additionalNotes}</p>
          </div>
        )}
            
        {/* Buttons */}
        <div className="mt-4 flex justify-start gap-4">
          <CheckoutButton
            cartItems={[
              {
                name: `Donation to ${candidate.name}'s Campaign`,
                price: 10,
                quantity: 1,
              },
            ]}
          />
          {!candidate.verified && (
            <Button 
              variant="purple" 
              size="xl" 
              onClick={() => router.push(`/candidate/verify?candidate=${normalizeSlug(candidate.name)}&candidateID=${candidate.id}&electionID=${election.id}`)}
              className="flex items-center gap-2"
            >
              <FaCheckCircle />
              <span>This is me</span>
            </Button>
          )}
        </div>

        {/* Sources Dropdown Section */}
        {candidate.sources && candidate.sources.length > 0 && (
          <div className="mt-6">
            <div className="relative inline-block">
                <button
                  onClick={() => setShowSources(!showSources)}
                  className="flex items-center text-sm text-purple-600 hover:underline focus:outline-none"
                >
                  <FaChevronUp className={`transition-transform duration-200 ${showSources ? "rotate-180" : "rotate-90"}`} />
                  <span className="ml-2">Sources</span>
                </button>
              <div className="absolute -top-0 -right-5">
                <FaQuestionCircle 
                  className="text-purple-600 cursor-pointer"
                  onMouseEnter={() => setDropdownHovered(true)}
                  onMouseLeave={() => setDropdownHovered(false)}
                />
              </div>
              {!candidate.verified && dropdownHovered && (
                <div className="absolute left-2/3 transform -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                  Since this candidate is not yet verified, the Elevra team <br /> compiled relevant information using these sources.
                </div>
              )}
            </div>
            {showSources && (
              <ul className="list-disc list-inside text-sm text-purple-600 mt-2">
                {candidate.sources.map((source: string, index: number) => (
                  <li key={index}>
                    <a href={source} target="_blank" rel="noopener noreferrer">
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </motion.div>

      {/* Suggested candidates sidebar */}
      <motion.div 
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full md:w-1/3 h-fit mt-24"
      >
        <div className="bg-white">
          <div className="text-gray-90 mb-4">
            <h2 className="text-xl text-center font-semibold">{election.position}</h2>
          </div>
          
          <div>
            {relatedCandidates.length > 0 ? (
              <div className="">
                {relatedCandidates.map((relatedCandidate:Candidate) => (
                  <Link 
                    key={relatedCandidate.name} 
                    href={`/candidate/${normalizeSlug(relatedCandidate.name)}?candidateID=${relatedCandidate.id}&electionID=${election.id}`}
                    className="block"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-3 rounded-lg transition-colors"
                    >
                      <Image
                        src={relatedCandidate.photo || '/default-profile.png'}
                        width={50}
                        height={50}
                        alt={relatedCandidate.name}
                        className="rounded-full shadow-sm mr-3"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{relatedCandidate.name}</h3>
                        <p className="text-xs text-gray-600">{relatedCandidate.position}</p>
                        <p className="text-xs font-medium text-purple-600 mt-1">{relatedCandidate.party}</p>
                      </div>
                      <FaUserPlus className="text-purple-600 ml-2" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No other candidates found in this election.</p>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 text-purple-600 border-purple-300 hover:bg-purple-50"
              onClick={() => {
                if (candidate.city && candidate.state) {
                  const cityStateKey = `${candidate.city.trim()}, ${candidate.state.trim()}`;
                  const zipCodes = cityStateToZip[cityStateKey];
                  const zipCode = zipCodes && zipCodes.length > 0 ? zipCodes[0] : "14850";
                  router.push(`/results?zipCode=${encodeURIComponent(zipCode)}`);
                } else {
                  console.error("Candidate city or state is missing.");
                }
              }}
            >
              View Election
            </Button>
          </div>
          {/* Suggested candidates sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full h-fit sticky top-24"
          >
            <div className="bg-white p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-600">Your Suggested Candidates</h2>
              </div>
              <div className="space-y-3 ">
                {randomSuggestedCandidates.map((rc) => (
                  <motion.div key={rc.name} className="flex items-center justify-between ">
                    <Link 
                      href={`/candidate/${normalizeSlug(rc.name)}/?candidateID=${rc.id}&electionID=${rc.electionId}`}
                      className="flex items-center gap-3 "
                    >
                        <Image
                          src={rc.photo || '/default-profile.png'}
                          width={40}
                          height={40}
                          alt={rc.name}
                          className="rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900">{rc.name}</span>
                          <p className="text-xs text-gray-600">{rc.position}</p>
                          <span className="text-xs text-purple-600 line-clamp-1">{rc.party}</span>
                        </div>
                      
                      <Button variant="ghost" size="sm" className="text-purple-600 w-[10%] absolute right-0 " >
                        View
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      
      {/* Popup Message */}
      {popupMessage && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 ${popupMessage.type === 'success' ? 'bg-purple-600' : 'bg-red-500'} text-white text-center px-4 py-2 rounded-3xl shadow-md z-50`}>
          {popupMessage.message}
          <button className="ml-2" onClick={() => setPopupMessage(null)}>✕</button>
        </div>
      )}
    </motion.div>
  );
}
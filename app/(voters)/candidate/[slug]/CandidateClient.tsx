// /candidate/[slug]/CandidateClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CandidateImage } from "@/components/CandidateImage";
import {
  FaCheckCircle,
  FaUserPlus,
  FaShare,
} from "react-icons/fa";
import { Edit } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button";
import { Candidate, Election } from "@prisma/client";
import type { ElectionLink } from "@prisma/client";
import { TabButton } from "@/components/ui/tab-button";
import { EndorsementTab } from "./EndorsementTab";
import { ContactTab } from "./ContactTab";
import { ElectionProfileTab } from "./ElectionTab";

export type ElectionWithCandidates = Election & { candidates: Candidate[] };

export default function CandidateClient({
  candidate,
  electionLinks,
  suggestedCandidates,
  isEditable,
}: {
  candidate: Candidate;
  electionLinks: (ElectionLink & {
    election: ElectionWithCandidates;
  })[];
  suggestedCandidates: Candidate[];
  isEditable: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [popupMessage, setPopupMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);

  // Use string to allow dynamic election tabs
  const [activeTab, setActiveTab] = useState<string>("about");
  // Derive active election tab from activeTab
  const activeElectionTab = useMemo(
    () =>
      electionLinks.find(
        (link) => `election-${link.electionId}` === activeTab
      ) || null,
    [activeTab, electionLinks]
  );

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

    // Get the current URL and decode it
    const currentUrl = new URL(window.location.href);
    const decodedUrl = decodeURIComponent(currentUrl.toString());

    // Check for donation status parameters in the decoded URL
    const hasCancel = decodedUrl.includes("cancel=true");
    const hasSessionId = decodedUrl.includes("session_id");
    const hasError = decodedUrl.includes("error");

    if (hasSessionId) {
      console.log("Setting success message");
      setPopupMessage({
        type: "success",
        message: `Your donation to ${candidateName} was successful! Thank you for your support!`,
      });
    } else if (hasCancel) {
      console.log("Setting cancel message");
      setPopupMessage({
        type: "error",
        message: `Your donation to ${candidateName} was cancelled.`,
      });
    } else if (hasError) {
      console.log("Setting error message");
      setPopupMessage({
        type: "error",
        message: `There was an error processing your donation. Please try again.`,
      });
    }

    if (hasSessionId || hasCancel || hasError) {
      // Clean up the URL by removing all donation-related parameters
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("session_id");
      cleanUrl.searchParams.delete("cancel");
      cleanUrl.searchParams.delete("error");

      // Get the clean electionID without any appended parameters
      const electionID = cleanUrl.searchParams.get("electionID")?.split("?")[0];
      if (electionID) {
        cleanUrl.searchParams.set("electionID", electionID);
      }

      // Update the URL without triggering a page reload
      window.history.replaceState({}, "", cleanUrl.toString());
    }
  }, [searchParams, candidate]);

  // Add a separate useEffect to handle popup message state changes
  useEffect(() => {
    console.log("Popup message state changed:", popupMessage);
  }, [popupMessage]);

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  if (!hydrated) return null;

  const verified = candidate.status === "APPROVED";

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
        <div className="flex flex-row items-start text-left gap-4">
          <CandidateImage
            clerkUserId={candidate.clerkUserId}
            publicPhoto={candidate.photo}
            name={candidate.name}
            width={150}
            height={150}
          />
          <div>
            <h1 className="mt-2 text-xl font-bold text-gray-900 flex items-center gap-2 relative">
              {candidate.name}
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setHovered(candidate.name)}
                onMouseLeave={() => setHovered(null)}
              >
                {verified ? (
                  <FaCheckCircle className="text-blue-500" />
                ) : (
                  <FaCheckCircle className="text-gray-400" />
                )}
                {hovered === candidate.name && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                    {verified
                      ? "This candidate has verified their information"
                      : "This candidate has not verified their information"}
                  </div>
                )}
              </div>
            </h1>
            <p className="text-sm font-semibold text-purple-600">
              {candidate.currentRole}
            </p>
            {candidate.currentCity && candidate.currentState ? (
              <p className="text-sm font-medium text-gray-500">
                {candidate.currentCity}, {candidate.currentState}
              </p>
            ) : null}
            <div className="mt-4 flex justify-start gap-4">
              {isEditable ? (
                <Button variant="outline" asChild>
                  <Link href="/candidates/candidate-dashboard/profile-settings">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              ) : null}
              {/* <Link href={`/candidate/${candidate.slug}/donate`} passHref>
                <Button
                  asChild
                  variant="green"
                  size="md"
                  className="flex items-center gap-2"
                >
                  <span className="flex items-center gap-2">
                    <FaDonate />
                    <span>Donate</span>
                  </span>
                </Button>
              </Link> */}
              <Button
                variant="purple"
                className="flex items-center gap-2"
                size="md"
                onClick={async () => {
                  const url = `${window.location.origin}/candidate/${candidate.slug}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: `Check out ${candidate.name}'s campaign on Elevra!`,
                        url,
                      });
                    } catch (error) {
                      console.error("Error sharing:", error);
                    }
                  } else {
                    navigator.clipboard.writeText(url);
                    alert("Profile link copied to clipboard!");
                  }
                }}
              >
                <FaShare /> Share Profile
              </Button>
              {/* {!verified && (
                <Button
                  variant="purple"
                  size="md"
                  onClick={() => {
                    router.push(
                      `/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`
                    );
                  }}
                  className="flex items-center gap-2"
                >
                  <FaCheckCircle />
                  <span>This is me</span>
                </Button>
              )} */}
            </div>
          </div>
        </div>
        <div className="inline-flex space-x-4 mb-4 justify-center w-full">
          <TabButton
            active={activeTab === "about"}
            onClick={() => setActiveTab("about")}
          >
            About
          </TabButton>
          {electionLinks.map((link) => (
            <TabButton
              key={link.electionId}
              active={activeTab === `election-${link.electionId}`}
              onClick={() => setActiveTab(`election-${link.electionId}`)}
            >
              {link.election.position}
            </TabButton>
          ))}
          <TabButton
            active={activeTab === "endorsements"}
            onClick={() => setActiveTab("endorsements")}
          >
            Endorsements
          </TabButton>
          <TabButton
            active={activeTab === "contact"}
            onClick={() => setActiveTab("contact")}
          >
            Contact
          </TabButton>
        </div>
        {/* Candidate Tabs */}

        {activeTab === "about" && (
          <>
            <div className="mt-4 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Biography</h2>
              <p>{candidate.bio}</p>
            </div>
          </>
        )}
        {activeTab === "endorsements" && (
          <div className="mt-4">
            <EndorsementTab candidateId={candidate.id} />
          </div>
        )}
        {activeTab === "contact" && (
          <div className="mt-4">
            <ContactTab
              email={candidate.email}
              website={candidate.website}
              phone={candidate.phone}
              linkedin={candidate.linkedin}
            />
          </div>
        )}

        {/* Election Profile Tab Content */}
        {activeTab.startsWith("election-") && activeElectionTab && (
          <>
            <ElectionProfileTab
              election={activeElectionTab.election}
              link={activeElectionTab}
            />
          </>
        )}
      </motion.div>

      {/* This sidebar previously relied on election and relatedCandidates. It now only shows suggested candidates. */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="w-full md:w-1/3 h-fit mt-24"
      >
        <div className="bg-white">
          {activeElectionTab && activeElectionTab.election && (
            <div>
              {/* Related candidates sidebar */}
              {activeElectionTab.election.candidates.length > 0 ? (
                <div className="">
                  {activeElectionTab.election.candidates.map(
                    (relatedCandidate: Candidate) => (
                      <Link
                        key={relatedCandidate.name}
                        href={`/candidate/${relatedCandidate.slug}`}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center p-3 rounded-lg transition-colors gap-3"
                        >
                          <CandidateImage
                            clerkUserId={relatedCandidate.clerkUserId}
                            publicPhoto={relatedCandidate.photo}
                            name={relatedCandidate.name}
                            width={50}
                            height={50}
                          />
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                              {relatedCandidate.name}
                              {relatedCandidate.verified ? (
                                <FaCheckCircle className="text-blue-500" />
                              ) : (
                                <FaCheckCircle className="text-gray-400" />
                              )}
                            </h3>
                            <p className="text-xs text-purple-600">
                              {relatedCandidate.currentRole}
                            </p>
                          </div>
                          <FaUserPlus className="text-purple-600 ml-2" />
                        </motion.div>
                      </Link>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No other candidates found in this election.
                </p>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 text-purple-600 border-purple-300 hover:bg-purple-50"
                onClick={() => {
                  if (
                    activeElectionTab.election.city &&
                    activeElectionTab.election.state
                  ) {
                    router.push(
                      `/results?city=${activeElectionTab.election.city}&state=${activeElectionTab.election.state}&electionID=${activeElectionTab.election.id}`
                    );
                  } else {
                    console.error("Candidate city or state is missing.");
                  }
                }}
              >
                View Election
              </Button>
            </div>
          )}
          {/* Suggested candidates sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="w-full h-fit sticky top-24"
          >
            <div className="bg-white p-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-600">
                  Your Suggested Candidates
                </h2>
              </div>
              <div className="space-y-3 ">
                {randomSuggestedCandidates.map((rc) => (
                  <motion.div
                    key={rc.id}
                    className="flex items-center justify-between "
                  >
                    <Link
                      href={`/candidate/${rc.slug}`}
                      className="flex items-center gap-3 "
                    >
                      <CandidateImage
                        clerkUserId={rc.clerkUserId}
                        publicPhoto={rc.photo}
                        name={rc.name}
                        width={40}
                        height={40}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          {rc.name}
                          {rc.verified ? (
                            <FaCheckCircle className="text-blue-500" />
                          ) : (
                            <FaCheckCircle className="text-gray-400" />
                          )}
                        </span>
                        <span className="text-xs text-purple-600 line-clamp-1">
                          {rc.currentRole}
                        </span>
                      </div>
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
        <div
          className={`fixed top-24 left-1/2 transform -translate-x-1/2 ${
            popupMessage.type === "success" ? "bg-purple-600" : "bg-red-500"
          } text-white text-center px-4 py-2 rounded-3xl shadow-md z-50`}
        >
          {popupMessage.message}
          <button className="ml-2" onClick={() => setPopupMessage(null)}>
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
}

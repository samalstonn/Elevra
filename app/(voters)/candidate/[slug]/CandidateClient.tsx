// /candidate/[slug]/CandidateClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CandidateImage } from "@/components/CandidateImage";
import { FaCheckCircle, FaUserPlus, FaShare } from "react-icons/fa";
import { Edit } from "lucide-react"; // Icons
import { Button } from "@/components/ui/button";
import { Candidate, Election } from "@prisma/client";
import type { ContentBlock, ElectionLink } from "@prisma/client";
import { TabButton } from "@/components/ui/tab-button";
import { EndorsementTab } from "./EndorsementTab";
import { ContactTab } from "./ContactTab";
import { ElectionProfileTab } from "./ElectionTab";
import { useAuth } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import ImageWithFallback from "@/components/ui/ImageWithFallback";
import { decodeEducation } from "@/lib/education";

function fisherYates<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export type ElectionWithCandidates = Election & {
  candidates: Candidate[];
};

export default function CandidateClient({
  candidate,
  electionLinks,
  suggestedCandidates,
  isEditable,
}: {
  candidate: Candidate;
  electionLinks: (ElectionLink & {
    election: ElectionWithCandidates;
    ContentBlock: ContentBlock[];
  })[];
  suggestedCandidates: Candidate[];
  isEditable: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // E2E test override: allow bypassing Clerk in CI by setting
  // NEXT_PUBLIC_E2E_TEST_MODE=1 and localStorage flags
  const e2eSignedIn =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1" &&
    localStorage.getItem("E2E_SIGNED_IN") === "1";
  const getE2EEmail = () =>
    typeof window !== "undefined"
      ? localStorage.getItem("E2E_USER_EMAIL") || undefined
      : undefined;
  const [popupMessage, setPopupMessage] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [hovered, setHovered] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
    const verified: Candidate[] = [];
    const unverified: Candidate[] = [];
    for (const c of suggestedCandidates) {
      if (c.id === candidate.id) continue;
      if (c.verified) {
        verified.push(c);
      } else {
        unverified.push(c);
      }
    }
    const shuffledVerified = fisherYates(verified);
    const shuffledUnverified = fisherYates(unverified);
    return [...shuffledVerified, ...shuffledUnverified].slice(0, 3);
  }, [candidate.id, suggestedCandidates]);

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
      setPopupMessage({
        type: "success",
        message: `Your donation to ${candidateName} was successful! Thank you for your support!`,
      });
    } else if (hasCancel) {
      setPopupMessage({
        type: "error",
        message: `Your donation to ${candidateName} was cancelled.`,
      });
    } else if (hasError) {
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

  // Abstracted function to reset content blocks and navigate to verify flow
  const handleThisIsMe = async () => {
    if (isResetting) return;
    if (!isSignedIn && !e2eSignedIn) {
      // Redirect immediately to Clerk sign-in, then to verification flow
      const verifyUrl = `/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(verifyUrl)}`);
      return;
    }
    try {
      setIsResetting(true);
      // Attempt immediate auto-approve if email matches (no content reset)
      const candidateEmail = candidate.email;
      let userEmail = user?.emailAddresses?.[0]?.emailAddress;
      const override = getE2EEmail();
      if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1" && override) {
        userEmail = override;
      }
      if (candidateEmail && userEmail && candidateEmail === userEmail) {
        try {
          const approve = await fetch(
            `/api/userValidationRequest/auto-approve`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                slug: candidate.slug,
                clerkUserId:
                  process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1"
                    ? "e2e-user"
                    : user?.id,
              }),
            }
          );
          if (approve.ok) {
            router.refresh();
            router.push(
              `/candidates/candidate-dashboard?verified=1&slug=${candidate.slug}`
            );
            return;
          }
        } catch (e) {
          console.error(
            "Auto-approve failed client-side, falling back to verify page",
            e
          );
        }
      }
      // Fallback: go to verify page (server will auto-approve if match not detected here)
      router.refresh();
      router.push(
        `/candidate/verify?candidate=${candidate.slug}&candidateID=${candidate.id}`
      );
    } catch (e) {
      console.error(e);
      alert("Could not start verification. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  if (!candidate) {
    return <div>Candidate not found</div>;
  }

  if (!hydrated) return null;

  const verified = candidate.verified;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="w-full mx-auto px-4 flex flex-col gap-6 mb-16 mt-0 pt-0"
    >
      {/* Main candidate profile card - keep desktop layout on MD+ screens */}
      <motion.div className="w-full flex flex-col p-4 bg-white">
        {/* Profile Header - Desktop: side by side, Mobile: stacked */}
        <div className="flex flex-col items-center md:flex-row md:items-start md:text-left text-center gap-4">
          <CandidateImage
            clerkUserId={candidate.clerkUserId}
            publicPhoto={candidate.photo}
            name={candidate.name}
            width={150}
            height={150}
            className="md:w-[150px] md:h-[150px] w-[80px] h-[80px]"
          />
          <div className="pl-2">
            <h1 className="mt-2 text-xl font-bold text-gray-900 flex items-center md:justify-start justify-center gap-2">
              {candidate.name}
              <div
                className="relative cursor-pointer"
                onMouseEnter={() => setHovered(candidate.name)}
                onMouseLeave={() => setHovered(null)}
                onClick={() =>
                  setHovered(hovered === candidate.name ? null : candidate.name)
                }
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

            {/* Desktop: normal buttons, Mobile: grid buttons */}
            <div className="mt-4 hidden md:flex justify-start gap-4">
              {isEditable ? (
                <Button variant="outline" asChild>
                  <Link href="/candidates/candidate-dashboard/my-profile">
                    <Edit className="mr-2 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              ) : null}

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

              {!verified && (
                <Button
                  variant="purple"
                  size="md"
                  onClick={handleThisIsMe}
                  disabled={isResetting}
                  className="flex items-center gap-2"
                >
                  <FaCheckCircle />
                  <span>{isResetting ? "Working..." : "This is me"}</span>
                </Button>
              )}
            </div>

            {/* Mobile-only buttons grid */}
            <div className="mt-4 gap-2 md:hidden flex justify-center">
              {isEditable ? (
                <Button
                  variant="outline"
                  asChild
                  className="flex justify-center text-sm px-2"
                >
                  <Link href="/candidates/candidate-dashboard/my-profile">
                    <Edit className="mr-1 h-4 w-4" /> Edit Profile
                  </Link>
                </Button>
              ) : null}

              <Button
                variant="purple"
                className="flex justify-center items-center gap-1 text-sm px-2"
                size="sm"
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
                <FaShare className="h-3 w-3" /> Share
              </Button>

              {!verified && (
                <Button
                  variant="purple"
                  size="sm"
                  onClick={handleThisIsMe}
                  disabled={isResetting}
                  className="flex justify-center items-center gap-1 text-sm px-2"
                >
                  <FaCheckCircle className="h-3 w-3" />
                  <span>{isResetting ? "..." : "This is me"}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - Desktop: regular spacing, Mobile: horizontal scroll */}
        <div className="md:inline-flex md:space-x-4 md:mb-4 md:justify-center md:w-full mt-6 mb-4 overflow-x-auto pb-2">
          <div className="inline-flex space-x-2 md:space-x-4 w-max min-w-full md:min-w-0">
            <TabButton
              active={activeTab === "about"}
              onClick={() => setActiveTab("about")}
              className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2"
            >
              About
            </TabButton>
            {electionLinks.map((link) => (
              <TabButton
                key={link.electionId}
                active={activeTab === `election-${link.electionId}`}
                onClick={() => setActiveTab(`election-${link.electionId}`)}
                className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2 whitespace-nowrap"
              >
                {link.election.position}
              </TabButton>
            ))}
            <TabButton
              active={activeTab === "endorsements"}
              onClick={() => setActiveTab("endorsements")}
              className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2"
            >
              Endorsements
            </TabButton>
            <TabButton
              active={activeTab === "contact"}
              onClick={() => setActiveTab("contact")}
              className="text-sm md:text-base px-3 md:px-4 py-1 md:py-2"
            >
              Contact
            </TabButton>
          </div>
        </div>

        {/* Tab Content - Same for both desktop and mobile */}
        {activeTab === "about" && (
          <>
            <div className="mt-4 text-sm text-gray-700">
              <h2 className="text-lg font-semibold text-gray-900">Biography</h2>
              <p>{candidate.bio}</p>
            </div>
            {/* Education */}
            {candidate.history && candidate.history.length > 0 && (
              <div className="mt-4 text-sm text-gray-700">
                <h2 className="text-lg font-semibold text-gray-900">
                  Education
                </h2>
                <EducationPublic history={candidate.history} />
              </div>
            )}
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
              verified={verified}
            />
          </div>
        )}

        {/* Election Profile Tab Content */}
        {activeTab.startsWith("election-") && activeElectionTab && (
          <>
            <ElectionProfileTab link={activeElectionTab} />
          </>
        )}
      </motion.div>

      {/* Related candidates section - shown below main content */}
      {activeElectionTab && activeElectionTab.election && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className=" w-full p-4 bg-white"
        >
          <h2 className="text-sm font-semibold text-gray-600 mb-3">
            {activeElectionTab.election.position} Candidates
          </h2>

          {/* Related candidates cards */}
          {activeElectionTab.election.candidates.length > 0 ? (
            <div className="space-y-2">
              {activeElectionTab.election.candidates.map(
                (relatedCandidate: Candidate) => (
                  <Link
                    key={relatedCandidate.slug}
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
                        width={40}
                        height={40}
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {relatedCandidate.name}
                          {relatedCandidate.verified ? (
                            <FaCheckCircle className="text-blue-500 h-3 w-3" />
                          ) : (
                            <FaCheckCircle className="text-gray-400 h-3 w-3" />
                          )}
                        </h3>
                        <p className="text-xs text-purple-600">
                          {relatedCandidate.currentRole}
                        </p>
                      </div>
                      <FaUserPlus className="text-purple-600 h-4 w-4" />
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
            className="mt-4 text-purple-600 border-purple-300 hover:bg-purple-50"
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
            View Entire Election
          </Button>
        </motion.div>
      )}

      {/* Suggested candidates section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        className="w-full bg-white p-4"
      >
        <div className="flex justify-between items-center mb-3 ">
          <h2 className="text-sm font-semibold text-gray-600">
            People who viewed {candidate.name} also viewed
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {randomSuggestedCandidates.map((rc) => (
            <Link
              key={rc.id}
              href={`/candidate/${rc.slug}`}
              className="flex items-center justify-between p-3 "
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3"
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
                      <FaCheckCircle className="text-blue-500 h-3 w-3" />
                    ) : (
                      <FaCheckCircle className="text-gray-400 h-3 w-3" />
                    )}
                  </span>
                  <span className="text-xs text-purple-600 line-clamp-1">
                    {rc.currentRole}
                  </span>
                </div>
              </motion.div>
              <FaUserPlus className="text-purple-600 h-4 w-4" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Responsive Popup Message */}
      {popupMessage && (
        <div
          className={`fixed top-4 left-4 right-4 md:top-24 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 ${
            popupMessage.type === "success" ? "bg-purple-600" : "bg-red-500"
          } text-white text-center px-4 py-2 md:rounded-3xl rounded-lg shadow-md z-50 flex items-center justify-between md:max-w-md`}
        >
          <span className="flex-1 text-sm md:text-base">
            {popupMessage.message}
          </span>
          <button
            className="ml-2 w-6 h-6 flex items-center justify-center"
            onClick={() => setPopupMessage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
}

function EducationPublic({ history }: { history: string[] }) {
  const items = history
    .map(decodeEducation)
    .filter(
      (
        e
      ): e is ReturnType<typeof decodeEducation> extends infer T
        ? T extends null
          ? never
          : T
        : never => !!e && !!e.name && !!e.country
    );
  if (items.length === 0) return null;
  return (
    <ul className="divide-y rounded-lg">
      {items.map((e, idx) => {
        const homepage = e.website ?? "";
        let host = "";
        try {
          host = homepage ? new URL(homepage).hostname : "";
        } catch {
          host = "";
        }
        const ddg = host
          ? `https://icons.duckduckgo.com/ip3/${host}.ico`
          : "/default-image-college.png";
        const clearbit = host
          ? `https://logo.clearbit.com/${host}`
          : "/default-image-college.png";
        return (
          <li key={idx} className="py-1 text-sm">
            <div className="flex flex-col items-start gap-2">
              {/* Move logo to the top */}
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={clearbit}
                  alt={`${e.name} logo`}
                  width={40}
                  height={40}
                  className="rounded bg-white shrink-0"
                  fallbackSrc={[ddg, "/default-image-college.png"]}
                />
                <div className="min-w-0">
                  <div className="font-medium text-base truncate">{e.name}</div>
                  {/* Location: locality in black, country gray with dot */}
                  <div className="text-sm">
                    {(() => {
                      const parts: React.ReactNode[] = [];
                      const hasLocality = !!(
                        e.city ||
                        e.state ||
                        e.stateProvince
                      );
                      if (e.city || e.state) {
                        parts.push(
                          <span key="locality" className="text-gray-900">
                            {e.city ? `${e.city}, ` : ""}
                            {e.state ?? ""}
                          </span>
                        );
                      } else if (e.stateProvince) {
                        parts.push(
                          <span key="province" className="text-gray-900">
                            {e.stateProvince}
                          </span>
                        );
                      }
                      if (e.country) {
                        if (hasLocality) {
                          parts.push(
                            <span key="dot" className="text-gray-500">
                              {" "}
                              {" · "}
                            </span>
                          );
                        }
                        parts.push(
                          <span key="country" className="text-gray-500">
                            {e.country}
                          </span>
                        );
                      }
                      return parts.length ? <>{parts}</> : null;
                    })()}
                  </div>
                </div>
              </div>
              {/* Degree and year: year gray; others black */}
              {e.degree ? (
                <div className="text-sm mt-1">
                  <span className="font-medium text-gray-900">Degree:</span>{" "}
                  <span className="text-gray-900">{e.degree}</span>
                  {e.graduationYear ? (
                    <span className="text-gray-500"> · {e.graduationYear}</span>
                  ) : null}
                </div>
              ) : e.graduationYear ? (
                <div className="text-sm mt-1">
                  <span className="font-medium text-gray-900">Graduation:</span>{" "}
                  <span className="text-gray-500">{e.graduationYear}</span>
                </div>
              ) : null}
              {e.activities && (
                <div className="text-smline-clamp-2">
                  <span className="font-medium text-gray-900">
                    Activities and Achievements:
                  </span>{" "}
                  <span className="text-gray-900">{e.activities}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

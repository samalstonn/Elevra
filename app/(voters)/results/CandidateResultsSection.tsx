"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/Card";
import { Candidate, Election } from "@prisma/client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { CandidateImage } from "@/components/CandidateImage"; // Adjust the path as needed
import { FaUserPlus } from "react-icons/fa"; // Import the user-plus icon from react-icons

interface CandidateSectionProps {
  candidates: Candidate[];
  election: Election;
  fallbackElections: Election[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function CandidateSection({
  candidates,
  election,
  fallbackElections,
}: CandidateSectionProps) {
  const electionIsActive = new Date(election.date) >= new Date();

  // If no election data is available
  if (!election) {
    return (
      <motion.div
        className="max-w-6xl mx-auto py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            No election information available
          </h2>
          <p className="text-gray-600 mb-8">
            Would you like to submit information about an upcoming election?
          </p>

          <div className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                <CardContent className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaUserPlus size={28} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center">
                    Submit a New Election
                  </h2>
                  <p className="text-gray-500 text-sm text-center mb-4">
                    Help us keep the community informed
                  </p>
                  <Link href="/submit" className="mt-auto mb-4">
                    <Button
                      variant="purple"
                      className="flex items-center gap-2"
                    >
                      <span>Submit Election Information</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {fallbackElections && fallbackElections.length > 0 && (
            <div className="mt-12">
              <h3 className="text-md font-semibold text-gray-800">
                Or browse these existing elections:
              </h3>
              <ul className="list-disc list-inside max-w-md mx-auto mt-4">
                {fallbackElections.map((fallbackElection) => (
                  <li key={fallbackElection.id} className="mt-2">
                    <Link
                      href={{ pathname: `/election/${fallbackElection.id}` }}
                    >
                      <span className="text-purple-600 hover:underline">
                        {fallbackElection.position}
                      </span>
                    </Link>
                    <span className="text-gray-600">
                      {" "}
                      -{" "}
                      {new Date(fallbackElection.date).toLocaleDateString(
                        "en-US",
                        {
                          timeZone: "UTC",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="max-w-6xl mx-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <h2 className="text-3xl font-semibold text-gray-900 mb-4 transition-colors">
        {election.position}
      </h2>

      {/* Election Card Section - Always displayed */}
      <div className="mb-2 md:mb-6">
        <div className="grid grid-cols-1 gap-4">
          <Card key={election.id} className="bg-transparent">
            <CardContent>
              <p className="text-sm text-gray-800">{election.description}</p>
              <p className="text-sm text-gray-800 mt-2">
                <strong>Positions:</strong> {election.positions}
              </p>
              <p className="text-sm text-gray-800 mt-2">
                <strong>Election Date:</strong>{" "}
                {new Date(election.date).toLocaleDateString("en-US", {
                  timeZone: "UTC",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    electionIsActive ? "text-green-600" : "text-red-600"
                  }
                >
                  {electionIsActive ? "Active" : "Inactive"}
                </span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Display blank candidate card if no candidates */}
      {!candidates || candidates.length === 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            No candidates available for this election yet.
          </h2>

          {/* Blank Candidate Card with CTA */}
          <div className="flex justify-center w-full mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                <CardContent className="flex flex-col items-center justify-center gap-4 h-full">
                  <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                    <FaUserPlus size={28} className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 text-center">
                    Are you running for {election.position}?
                  </h2>
                  <p className="text-gray-500 text-sm text-center mb-4">
                    Please let us know here
                  </p>
                  <Link href="/submit" className="mt-auto mb-4">
                    <Button
                      variant="purple"
                      className="flex items-center gap-2"
                    >
                      <span>Submit Your Information</span>
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Fallback Elections Section */}
          {fallbackElections && fallbackElections.length > 0 && (
            <div className="mt-8">
              <h3 className="text-md font-semibold text-gray-800">
                You might be interested in these elections:
              </h3>
              <ul className="list-disc list-inside">
                {fallbackElections.map((fallbackElection) => (
                  <li key={fallbackElection.id} className="mt-2">
                    <Link
                      href={{ pathname: `/election/${fallbackElection.id}` }}
                    >
                      <span className="text-purple-600 hover:underline">
                        {fallbackElection.position}
                      </span>
                    </Link>
                    <span className="text-gray-600">
                      {" "}
                      -{" "}
                      {new Date(fallbackElection.date).toLocaleDateString(
                        "en-US",
                        {
                          timeZone: "UTC",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        /* Candidate Cards Section - Only shown if candidates exist */
        <motion.div className="flex flex-nowrap gap-2 overflow-x-auto md:grid md:grid-cols-3 sm:gap-2 md:flex-wrap md:overflow-visible justify-start">
          {candidates.map((candidate, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="flex-shrink-0"
            >
              <Link href={`/candidate/${candidate.slug}`}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Card className="group transition-all rounded-lg cursor-pointer h-[315px] w-[350px] flex flex-col relative">
                    <CardContent className="flex flex-col gap-2">
                      <CandidateImage
                        photo={candidate.photo}
                        name={candidate.name}
                        width={64}
                        height={64}
                      />
                      <h2 className="text-xl font-semibold text-gray-900 mt-2 line-clamp-2">
                        {candidate.name}
                      </h2>
                      <p className="w-[85%] text-purple-700 text-sm ">
                        {candidate.position}
                      </p>
                      <p
                        className={`w-[75%] text-gray-500 text-xs ${
                          candidate.position.length > 37
                            ? "line-clamp-3"
                            : "line-clamp-4"
                        }`}
                        style={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {candidate.bio}
                      </p>

                      <motion.div
                        className="absolute bottom-0"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <Button
                          variant="purple"
                          size="sm"
                          onClick={() => {
                            /* placeholder function */
                          }}
                          className="flex items-center gap-2"
                        >
                          <span>Learn More</span>
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

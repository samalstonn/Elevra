import { Button } from "@/components/ui/button";
import { Election, ElectionLink } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { FaChevronUp, FaQuestionCircle } from "react-icons/fa";
import { MdHowToVote } from "react-icons/md";

export type ElectionProfileTabProps = {
  link: ElectionLink;
};

export function ElectionProfileTab({ link }: ElectionProfileTabProps) {
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const [showSources, setShowSources] = useState(false);
  return (
    <div className="mt-4 border rounded p-4 bg-gray-50">
      {link.party && <p className="text-sm mt-2">Party: {link.party}</p>}
      {link.policies && link.policies.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">Policies</h2>
          <ul className="space-y-1 text-sm">
            {link.policies.map((policy, index) => (
              <li key={index}>
                <span className="">{policy}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Additional Notes */}
      {link.additionalNotes && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Additional Notes
          </h2>
          <p className="text-sm">{link.additionalNotes}</p>
        </div>
      )}
      {/* Sources Dropdown Section */}
      {link.sources && link.sources.length > 0 && (
        <div className="mt-6">
          <div className="relative inline-block">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center text-sm text-purple-600 hover:underline focus:outline-none"
            >
              <FaChevronUp
                className={`transition-transform duration-200 ${
                  showSources ? "rotate-180" : "rotate-90"
                }`}
              />
              <span className="ml-2">Sources</span>
            </button>
            <div className="absolute -top-0 -right-5">
              <FaQuestionCircle
                className="text-purple-600 cursor-pointer"
                onMouseEnter={() => setDropdownHovered(true)}
                onMouseLeave={() => setDropdownHovered(false)}
              />
            </div>
            {dropdownHovered && (
              <div className="absolute left-2/3 transform -translate-x-1/2 -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap">
                Since this candidate is not yet verified, the Elevra team <br />{" "}
                compiled relevant information using these sources.
              </div>
            )}
          </div>
          {showSources && (
            <ul className="list-disc list-inside text-sm text-purple-600 mt-2">
              {link.sources.map((source: string, index: number) => (
                <li key={index}>
                  <span className="cursor-default">{source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {link.votinglink ? (
        <Link href={link.votinglink} passHref target="_blank">
          <Button
            asChild
            variant="purple"
            size="md"
            className="flex items-center gap-2"
            rel="noopener noreferrer"
          >
            <span className="flex items-center gap-2">
              <MdHowToVote />
              <span>Vote</span>
            </span>
          </Button>
        </Link>
      ) : null}
    </div>
  );
}

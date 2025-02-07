import React from "react";
import ElectionCard from "./ElectionCard";
import { election_data}  from "../app/lib/models";


interface ResultsSectionProps {
  zipCode: string;
  elections: election_data[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ zipCode, elections }) => {
  const handleVisit = (electionID: number) => {
    const election_link = `/elections/${electionID}`;
    window.location.href = election_link;
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-center">
        Elections under ZIP Code: <span className="text-blue-500">{zipCode}</span>
      </h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {elections.map((election, index) => (
          <ElectionCard
            key = {index}
            electionID={Number(election.electionID)}
            position={election.position}
            candidate_number={election.candidate_number}
            election_link={`/elections/${election.position}`}
            onVisit={handleVisit}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;

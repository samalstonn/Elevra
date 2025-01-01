import React from "react";
import ElectionCard from "./ElectionCard";

interface ResultsSectionProps {
  zipCode: string;
  elections: { position: string; candidate_number: string }[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ zipCode, elections }) => {
  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-center">
        Elections under ZIP Code: <span className="text-blue-500">{zipCode}</span>
      </h2>
      <div className= "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {elections.map((election, index) => (
          <ElectionCard
            key={index}
            position={election.position}
            candidate_number={election.candidate_number}
            election_link={`/elections/${election.position}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ResultsSection;

import React from "react";

type ElectionCardProps = {
  electionID: number;
  position: string;
  candidate_number: string;
  election_link: string;
  onVisit: (key: number) => void; 
};

const ElectionCard: React.FC<ElectionCardProps> = ({ electionID, position, candidate_number, election_link, onVisit }) => {
  console.log(electionID)
  return (
    <div className="bg-white shadow-md rounded-lg p-5 w-full max-w-sm">
      <h3 className="text-xl font-semibold">{position}</h3>
      <p className="text-gray-600">{candidate_number} candidates running</p>
      <button
        onClick={() => onVisit(electionID)} 
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Visit Election
      </button>
    </div>
  );
};

export default ElectionCard;

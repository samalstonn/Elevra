import React from "react";

interface ElectionCardProps {
  position: string;
  candidate_number: string;
  election_link: string;
}

const ElectionCard: React.FC<ElectionCardProps> = ({ position, candidate_number, election_link }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-5 w-full max-w-sm">
      <h3 className="text-xl font-semibold">{position}</h3>
      <p className="text-gray-600">{candidate_number} candidates running</p>
      <button onClick={() => window.location.href = election_link} className="bg-blue-500 text-white px-4 py-2 mt-3 rounded hover:bg-blue-600">
        Visit Election
      </button>
    </div>
  );
};

export default ElectionCard;

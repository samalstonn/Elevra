import React from "react";

interface CandidateCardProps {
  name: string;
  description: string;
  onVisit: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ name, description, onVisit }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-xs text-center">
      <h2 className="text-lg font-bold text-gray-800">{name}</h2>
      <p className="text-sm text-gray-600 mt-2">{description}</p>
      <button
        onClick={onVisit}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition"
      >
        Visit Campaign
      </button>
    </div>
  );
};

export default CandidateCard;

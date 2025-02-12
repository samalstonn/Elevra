import React, { useState } from "react";

interface ZipCodeInputProps {
  onSearch: (zipCode: string) => void;
}

const ZipCodeInput: React.FC<ZipCodeInputProps> = ({ onSearch }) => {
  const [zipCode, setZipCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(zipCode);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex justify-center items-center mt-6"
    >
      <input
        type="text"
        placeholder="Enter your ZIP code..."
        value={zipCode}
        onChange={(e) => setZipCode(e.target.value)}
        className="p-2 border border-gray-300 rounded-l-lg focus:outline-none"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
      >
        Search
      </button>
    </form>
  );
};

export default ZipCodeInput;

import React from "react";

export default function HomePage() {
  return (
    <div className="bg-purple-300 flex flex-col items-center justify-center text-black">

      {/* Main Content */}
      <div className="text-center max-w-lg">
        <h1 className="text-4xl font-bold mb-4">Discover local leaders near you.</h1>
        <div className="bg-black text-black flex items-center rounded-full px-4 py-2 mt-4">
            <input
                type="text"
                placeholder="Enter delivery address"
                className="flex-grow outline-none px-2 text-sm bg-transparent text-white"
            />
            
            <button
                className="bg-purple-300 text-black px-4 py-2 rounded-full flex items-center justify-center hover:bg-orange-400 transition"
            >
                ➔
            </button>
        </div>
        <button className="flex items-center justify-items-center gap-2 mt-4 text-sm text-black bg-transparent border border-white px-4 py-2 rounded-full hover:bg-black hover:text-orange-400 transition">
          <span>📍</span> Sign in for saved addresses
        </button>
      </div>

      {/* Sign In/Sign Up Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button className="bg-transparent border border-black px-4 py-2 rounded-full hover:bg-black hover:text-red-500 transition">
          Sign In
        </button>
        <button className="bg-black text-red-500 px-4 py-2 rounded-full hover:bg-red-500 hover:text-black transition">
          Sign Up
        </button>
      </div>
    </div>
  );
}

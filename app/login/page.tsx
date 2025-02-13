"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaFacebook, FaTwitter, FaGoogle } from "react-icons/fa";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    // Simulating authentication (replace with real API call)
    if (email === "admin@example.com" && password === "password123") {
      router.push("/dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">Welcome to Elevra!</h2>

        {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Field */}
          <div className="relative">
            <FaUser className="absolute left-4 top-3.5 text-gray-500 text-lg" />
            <input
              type="email"
              placeholder="Your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <FaLock className="absolute left-4 top-3.5 text-gray-500 text-lg" />
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <a href="#" className="text-purple-600 text-sm hover:underline">Forgot password?</a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 rounded-full text-lg font-semibold hover:opacity-90 transition"
          >
            LOGIN
          </button>
        </form>

        {/* Social Login */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-lg mb-4">Or Sign Up Using:</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="p-3 bg-blue-600 text-white rounded-full hover:opacity-80 transition">
              <FaFacebook className="text-xl" />
            </a>
            <a href="#" className="p-3 bg-blue-400 text-white rounded-full hover:opacity-80 transition">
              <FaTwitter className="text-xl" />
            </a>
            <a href="#" className="p-3 bg-red-600 text-white rounded-full hover:opacity-80 transition">
              <FaGoogle className="text-xl" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
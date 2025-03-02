"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../app/lib/auth-context";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const { signup } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!signupData.email || !signupData.password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await signup({
        email: signupData.email,
        password: signupData.password,
      });

      router.push("/login-page");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center">
          <h2 className="flex-1 text-center text-xl font-bold text-purple-900">
            Create your account
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <FaTimes size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}

        {/* Signup Form */}
        <form onSubmit={handleSignupSubmit} className="space-y-4 mt-4">
          {/* Email Input */}
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={signupData.email}
            onChange={handleSignupChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
          />

          {/* Password Input */}
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={signupData.password}
            onChange={handleSignupChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
          />

          {/* Confirm Password Input */}
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={signupData.confirmPassword}
            onChange={handleSignupChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
          />

          {/* Signup Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-900 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition disabled:opacity-70"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <a href="#" className="hover:underline">Terms of Use</a> | 
          <a href="#" className="hover:underline"> Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
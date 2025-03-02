"use client";

import { useState } from "react";
import { FaGoogle, FaApple, FaPhone } from "react-icons/fa";
import { useAuth } from "../lib/auth-context";
import { useRouter } from "next/navigation";
import AuthModal from "../../components/AuthModal"; // Import the signup modal

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const [isSignupOpen, setIsSignupOpen] = useState(false); // State to manage signup modal visibility

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred during login");
      } else {
        setError("An error occurred during login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white p-8 rounded-xl">
        {/* Welcome Message */}
        <h2 className="text-xl font-bold text-center mb-6 text-purple-900">Welcome back to Elevra</h2>

        {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-1">Email address*</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-1">Password*</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Login Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-purple-900 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Sign Up Link - Opens the Signup Modal */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{" "}
          <span 
            className="text-purple-900 font-medium hover:underline cursor-pointer"
            onClick={() => setIsSignupOpen(true)}
          >
            Sign Up
          </span>
        </p>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition">
            <FaGoogle className="text-red-500" />
            Continue with Google
          </button>

          <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition">
            <FaApple className="text-black" />
            Continue with Apple
          </button>

          <button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-3 rounded-lg hover:bg-gray-100 transition">
            <FaPhone className="text-purple-900" />
            Continue with phone
          </button>
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm text-gray-500 mt-6">
          <a href="#" className="hover:underline">
            Terms of Use
          </a>{" "}
          |{" "}
          <a href="#" className="hover:underline">
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Signup Modal */}
      {isSignupOpen && <AuthModal isOpen={isSignupOpen} onClose={() => {
        setIsSignupOpen(false);
        window.location.reload(); // Reload the page after signup
      }} />}
    </div>
  );
}
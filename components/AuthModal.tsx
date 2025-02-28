"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock, FaEnvelope, FaMapMarkerAlt, FaTimes } from "react-icons/fa";
import { useAuth } from "../app/lib/auth-context";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "signup";
};

export default function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const { login, signup } = useAuth();

  // State declarations (always called in the same order)
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup state
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    zipcode: ""
  });

  // Success message state
  const [success, setSuccess] = useState<string | null>(null);

  // Effects (always executed)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const successMsg = urlParams.get("success");
    if (successMsg) {
      setSuccess(successMsg);
      // Remove success param from URL
      urlParams.delete("success");
      const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  useEffect(() => {
    setSuccess(null);
  }, [mode]);

  // Early return: all hooks have already been called
  if (!isOpen) return null;

  // Event handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!loginEmail || !loginPassword) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      await login(loginEmail, loginPassword);
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!signupData.email || !signupData.password || !signupData.username) {
      setError("Username, email and password are required");
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
        username: signupData.username,
        password: signupData.password,
        name: signupData.name,
        zipcode: signupData.zipcode
      });

      // Switch to login mode with pre-filled email
      setMode("login");
      setError("");
      setLoginEmail(signupData.email);
    } catch (err: any) {
      setError(err.message || "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 z-10"
        >
          <FaTimes size={24} />
        </button>
        
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center font-medium ${
              mode === "login" 
                ? "text-purple-900 border-b-2 border-purple-900" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium ${
              mode === "signup" 
                ? "text-purple-900 border-b-2 border-purple-900" 
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setMode("signup")}
          >
            Sign Up
          </button>
        </div>
        
        <div className="p-8">
          {success && <p className="mb-4 text-green-500 text-sm text-center">{success}</p>}
          {error && <p className="mb-4 text-red-500 text-sm text-center">{error}</p>}
          
          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaLock className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="text-right">
                <a href="#" className="text-purple-900 text-sm hover:underline">
                  Forgot password?
                </a>
              </div>
  
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-900 to-pink-500 text-white py-3 rounded-full text-lg font-semibold hover:opacity-90 transition disabled:opacity-70"
              >
                {loading ? "SIGNING IN..." : "LOGIN"}
              </button>
            </form>
          )}
          
          {/* Signup Form */}
          {mode === "signup" && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={signupData.username}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaEnvelope className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={signupData.email}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaLock className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaLock className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={signupData.confirmPassword}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaUser className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="text"
                  name="name"
                  placeholder="Full name (optional)"
                  value={signupData.name}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-4 top-3.5 text-gray-500 text-lg" />
                <input
                  type="text"
                  name="zipcode"
                  placeholder="Zipcode (optional)"
                  value={signupData.zipcode}
                  onChange={handleSignupChange}
                  className="w-full pl-12 px-4 py-3 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-900"
                />
              </div>
  
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-900 to-pink-500 text-white py-3 rounded-full text-lg font-semibold hover:opacity-90 transition disabled:opacity-70"
              >
                {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
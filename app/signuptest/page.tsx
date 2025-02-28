import { FaGoogle, FaApple, FaPhone } from "react-icons/fa";

export default function Login() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md bg-white p-8 rounded-xl pt-0">

        {/* Welcome Message */}
        <h2 className="text-xl font-large text-center mb-4 text-purple-900">Welcome back</h2>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">Email address*</label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-900 focus:outline-none"
            placeholder="Enter your email"
          />
        </div>

        {/* Continue Button */}
        <button className="w-full bg-purple-900 text-white py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition">
          Continue
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="#" className="text-purple-900 font-medium hover:underline">
            Sign Up
          </a>
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
    </div>
  );
}
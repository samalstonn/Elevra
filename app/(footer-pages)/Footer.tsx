import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 text-center text-sm text-gray-500 border-t border-gray-200">
      <div className="flex flex-col md:flex-row justify-center items-center gap-2">
        <span>
          &copy; {new Date().getFullYear()} Elevra. All rights reserved.
        </span>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:underline">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link href="/feedback" className="hover:underline">
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
}

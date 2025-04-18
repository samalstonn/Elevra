// app/sign-up/[[...sign-up]]/page.js
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white p-8 border-none shadow-none",
              headerTitle: "text-xl font-bold text-center mb-6 text-purple-700",
              headerSubtitle: "text-center text-gray-600",
              formButtonPrimary:
                "w-full bg-purple-700 text-white py-3 rounded-lg hover:bg-purple-800 transition disabled:opacity-70",
              formFieldInput:
                "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-700",
              formFieldLabel: "text-gray-700 font-medium",
              footerActionText: "text-gray-700",
              footerActionLink:
                "text-purple-700 font-medium hover:text-purple-800",
              dividerLine: "bg-gray-200",
              dividerText: "text-gray-500",
              socialButtonsBlockButton:
                "border border-gray-300 hover:bg-gray-50",
              socialButtonsBlockButtonText: "text-gray-700 font-medium",
              socialButtonsBlockButtonArrow: "text-gray-500",
              alert: "text-red-600 text-sm",
            },
            layout: {
              socialButtonsPlacement: "bottom",
            },
            variables: {
              colorPrimary: "#6D28D9",
              colorText: "#374151",
              colorTextSecondary: "#6B7280",
              colorBackground: "#F9FAFB",
              fontFamily: "system-ui, -apple-system, sans-serif",
              borderRadius: "0.375rem",
            },
          }}
        />
      </div>
    </div>
  );
}

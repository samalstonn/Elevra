"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const sendTestEmail = async () => {
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: "adam@elevracommunity.com",
          subject: "Test Email",
          html: "<p>This is a test email with <a href='https://elevracommunity.com'>a link</a></p>",
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Email sent successfully!");
      } else {
        alert("Email failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Email failed");
    }
  };

  return (
    <main className="max-w-4xl mx-auto mt-10 p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="space-y-4">
        <Link
          href="/admin/user-validation"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          View User Validation Requests
        </Link>
        <button
          onClick={sendTestEmail}
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Send Test Email
        </button>
      </div>
    </main>
  );
}

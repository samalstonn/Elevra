import Link from "next/link";

export default function AdminDashboard() {
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
      </div>
    </main>
  );
}

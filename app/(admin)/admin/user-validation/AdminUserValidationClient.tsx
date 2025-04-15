"use client";

import { UserValidationRequest } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
  validationRequests: UserValidationRequest[];
};

export default function AdminUserValidationClient({
  validationRequests,
}: Props) {
  async function approveRequest(requestId: number) {
    try {
      const response = await fetch("/api/admin/approve-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        console.error("Failed to approve request");
      } else {
        location.reload();
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  }

  return (
    <Card className="max-w-6xl mx-auto mt-10">
      <CardHeader>
        <CardTitle>User Validation Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-auto border border-gray-300">
            <thead>
              <tr>
                <th className="p-2 border border-gray-300">Name</th>
                <th className="p-2 border border-gray-300">Email</th>
                <th className="p-2 border border-gray-300">Phone</th>
                <th className="p-2 border border-gray-300">Position</th>
                <th className="p-2 border border-gray-300">Website</th>
                <th className="p-2 border border-gray-300">LinkedIn</th>
                <th className="p-2 border border-gray-300">Twitter</th>
                <th className="p-2 border border-gray-300">Additional Info</th>
                <th className="p-2 border border-gray-300">City</th>
                <th className="p-2 border border-gray-300">State</th>
                <th className="p-2 border border-gray-300">Status</th>
                <th className="p-2 border border-gray-300">Election ID</th>
                <th className="p-2 border border-gray-300">Candidate ID</th>
                <th className="p-2 border border-gray-300">Submitted</th>
                <th className="p-2 border border-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {validationRequests.map((req) => (
                <tr key={req.id}>
                  <td className="p-2 border border-gray-300">{req.fullName}</td>
                  <td className="p-2 border border-gray-300">{req.email}</td>
                  <td className="p-2 border border-gray-300">{req.phone}</td>
                  <td className="p-2 border border-gray-300">{req.position}</td>
                  <td className="p-2 border border-gray-300">{req.website}</td>
                  <td className="p-2 border border-gray-300">{req.linkedin}</td>
                  <td className="p-2 border border-gray-300">{req.twitter}</td>
                  <td className="p-2 border border-gray-300">
                    {req.additionalInfo}
                  </td>
                  <td className="p-2 border border-gray-300">{req.city}</td>
                  <td className="p-2 border border-gray-300">{req.state}</td>
                  <td className="p-2 border border-gray-300">{req.status}</td>
                  <td className="p-2 border border-gray-300">
                    {req.electionId}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {req.candidateId}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 border border-gray-300">
                    {req.status !== "APPROVED" ? (
                      <button
                        onClick={() => approveRequest(req.id)}
                        className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 text-xs rounded"
                      >
                        Approve
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">Approved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

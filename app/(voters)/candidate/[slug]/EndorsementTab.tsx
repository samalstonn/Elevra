"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Endorsement } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton } from "@clerk/nextjs";

interface EndorsementTabProps {
  candidateId: number;
}

export function EndorsementTab({ candidateId }: EndorsementTabProps) {
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    async function fetchEndorsements() {
      try {
        const res = await fetch(`/api/candidates/${candidateId}/endorsements`);
        if (!res.ok) throw new Error("Failed to fetch endorsements");
        const data: Endorsement[] = await res.json();
        setEndorsements(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEndorsements();
  }, [candidateId]);

  return (
    <div>
      <div className="mb-4">
        {loading ? (
          <p>Loading endorsements...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : endorsements.length === 0 ? (
          <p>No endorsements yet.</p>
        ) : (
          <div className="space-y-6">
            {endorsements.map((endorsement) => (
              <div key={endorsement.id} className="p-4 border rounded-md">
                <h3 className="font-semibold text-gray-900">
                  {endorsement.endorserName}
                </h3>
                {endorsement.relationshipDescription && (
                  <p className="text-sm text-gray-500">
                    {endorsement.relationshipDescription}
                  </p>
                )}
                <p className="mt-2 text-gray-700">{endorsement.content}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(endorsement.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      {isSignedIn ? (
        <>
          {!showForm && (
            <Button
              className="mb-4"
              variant="purple"
              onClick={() => setShowForm(true)}
            >
              Endorse This Candidate
            </Button>
          )}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg w-full max-w-md p-6">
                <h2 className="text-lg font-semibold mb-4 text-purple-800">
                  Submit Endorsement
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const formData = new FormData(form);
                    const payload = {
                      endorserName: formData.get("endorserName"),
                      relationshipDescription: formData.get(
                        "relationshipDescription"
                      ),
                      content: formData.get("content"),
                      clerkUserId: "userId", // Replace with actual userId from context
                    };
                    const res = await fetch(
                      `/api/candidates/${candidateId}/endorsements`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                      }
                    );
                    if (res.ok) {
                      setShowForm(false);
                      router.refresh();
                    } else {
                      alert("Failed to submit endorsement");
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <input
                      name="endorserName"
                      required
                      className="mt-1 block w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Relationship (We worked together during...)
                    </label>
                    <input
                      name="relationshipDescription"
                      className="mt-1 block w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Endorsement
                    </label>
                    <textarea
                      name="content"
                      required
                      className="mt-1 block w-full border p-2 rounded"
                    />
                  </div>
                  <div className="mt-6 flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Submit</Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <SignInButton>
          <Button variant="purple" className="mb-4">
            Sign in to endorse
          </Button>
        </SignInButton>
      )}
    </div>
  );
}

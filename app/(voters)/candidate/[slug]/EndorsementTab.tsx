import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUser, SignInButton } from "@clerk/nextjs";
import { UserCircle2 } from "lucide-react";

interface EndorsementData {
  id: number;
  endorserName: string;
  relationshipDescription: string | null;
  content: string;
  createdAt: string;
  clerkUserId: string;
}

interface EndorsementTabProps {
  candidateId: number;
}

export function EndorsementTab({ candidateId }: EndorsementTabProps) {
  const [endorsements, setEndorsements] = useState<EndorsementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const { isSignedIn, user } = useUser();

  const handleDelete = async (endorsementId: number) => {
    if (!confirm("Are you sure you want to delete your endorsement?")) return;
    try {
      const res = await fetch(`/api/endorsement`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endorsementId, clerkUserId: user?.id }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setEndorsements((prev) => prev.filter((e) => e.id !== endorsementId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete endorsement");
    }
  };

  useEffect(() => {
    async function fetchEndorsements() {
      try {
        const res = await fetch(`/api/endorsement?candidateId=${candidateId}`);
        if (res.status === 404) {
          // No endorsements found
          setEndorsements([]);
          setError(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch endorsements");
        const json = await res.json();
        const list: EndorsementData[] = Array.isArray(json)
          ? json
          : json.endorsements ?? [];
        setEndorsements(list);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
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
              <div
                key={endorsement.id}
                className="relative p-4 rounded-xl flex items-start gap-4 bg-white "
              >
                <div className="rounded-full bg-gray-100 p-2">
                  <UserCircle2 className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
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
                  {user?.id === endorsement.clerkUserId && (
                    <button
                      onClick={() => handleDelete(endorsement.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                      aria-label="Delete endorsement"
                    >
                      &times;
                    </button>
                  )}
                </div>
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
                      candidateId,
                      endorserName: formData.get("endorserName"),
                      relationshipDescription: formData.get(
                        "relationshipDescription"
                      ),
                      content: formData.get("content"),
                      clerkUserId: user?.id || "", // Use actual userId from context
                    };
                    const res = await fetch(`/api/endorsement`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                    });
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
                      defaultValue={user?.fullName || ""}
                      className="mt-1 block w-full border p-2 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Relationship (We worked together during...)
                    </label>
                    <input
                      name="relationshipDescription"
                      required
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
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
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

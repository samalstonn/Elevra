// app/candidate/edit/EditCandidateForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Candidate, Election } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeSlug } from "@/lib/functions";

export default function EditCandidateForm({ 
  candidate, 
  election 
}: { 
  candidate: Candidate; 
  election: Election | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: candidate.name,
    position: candidate.position,
    party: candidate.party,
    bio: candidate.bio || "",
    website: candidate.website || "",
    linkedin: candidate.linkedin || "",
    twitter: candidate.twitter || "",
    additionalNotes: candidate.additionalNotes || "",
    city: candidate.city || "",
    state: candidate.state || "",
    policies: candidate.policies.join("\n") || "",
    sources: candidate.sources?.join("\n") || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert policies and sources from newline-separated text to arrays
      const policies = formData.policies
        .split("\n")
        .map(policy => policy.trim())
        .filter(policy => policy.length > 0);
      
      const sources = formData.sources
        .split("\n")
        .map(source => source.trim())
        .filter(source => source.length > 0);

      const response = await fetch('/api/candidate/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          name: formData.name,
          position: formData.position,
          party: formData.party,
          bio: formData.bio,
          website: formData.website,
          linkedin: formData.linkedin,
          twitter: formData.twitter,
          additionalNotes: formData.additionalNotes,
          city: formData.city,
          state: formData.state,
          policies,
          sources,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update candidate information');
      }

      setSuccess('Your profile has been updated successfully!');
      
      // Redirect after a delay to allow user to see success message
      setTimeout(() => {
        router.push(`/candidate/${normalizeSlug(formData.name)}?candidateID=${candidate.id}&electionID=${candidate.electionId}`);
        router.refresh(); // Force a refresh to show updated data
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Your Candidate Profile</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
            <Input
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
            <Input
              name="party"
              value={formData.party}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={5}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Policies (one per line)</label>
            <Textarea
              name="policies"
              value={formData.policies}
              onChange={handleChange}
              rows={5}
              className="w-full"
              placeholder="Each policy on a new line"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <Input
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="w-full"
                placeholder="https://example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <Input
                name="linkedin"
                type="url"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
              <Input
                name="twitter"
                type="url"
                value={formData.twitter}
                onChange={handleChange}
                className="w-full"
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <Input
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <Textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={3}
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sources (one URL per line)</label>
            <Textarea
              name="sources"
              value={formData.sources}
              onChange={handleChange}
              rows={3}
              className="w-full"
              placeholder="https://example.com/source1&#10;https://example.com/source2"
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="purple"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
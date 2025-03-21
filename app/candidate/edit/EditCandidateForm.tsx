// app/candidate/edit/EditCandidateForm.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaGlobe, FaTwitter, FaLinkedin, FaCheckCircle, FaArrowLeft, FaSave, FaTimes } from "react-icons/fa";
import { Candidate, Election } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { normalizeSlug } from "@/lib/functions";

type ElectionWithCandidates = Election & { candidates: Candidate[] };

export default function EditCandidateForm({ 
  candidate, 
  election 
}: { 
  candidate: Candidate; 
  election: ElectionWithCandidates | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  
  // Form state
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
    policies: candidate.policies,
    sources: candidate.sources || [],
  });

  // State for new policy or source being added
  const [newPolicy, setNewPolicy] = useState("");

  // Generate a few related candidates for the preview sidebar
  const relatedCandidates = useMemo(() => {
    if (!election?.candidates) return [];
    return election.candidates
      .filter((c) => c.id !== candidate.id)
      .slice(0, 3);
  }, [election, candidate]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addPolicy = () => {
    if (newPolicy.trim()) {
      setFormData((prev) => ({
        ...prev,
        policies: [...prev.policies, newPolicy.trim()],
      }));
      setNewPolicy("");
    }
  };

  const removePolicy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      policies: prev.policies.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
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
          policies: formData.policies,
          sources: formData.sources,
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
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Notification messages */}
      {error && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-center px-4 py-2 rounded-3xl shadow-md z-50">
          {error}
          <button className="ml-2" onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {success && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white text-center px-4 py-2 rounded-3xl shadow-md z-50">
          {success}
          <button className="ml-2" onClick={() => setSuccess(null)}>✕</button>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="container mx-auto px-4 flex flex-col md:flex-row gap-6 mb-16"
      >
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-purple-600 hover:text-purple-800 flex items-center gap-2"
          >
            <FaArrowLeft /> Back
          </Button>
        </div>
        {/* Main candidate profile edit section */}
        <motion.div className="w-full md:w-2/3 flex flex-col sm:p-6 bg-white">
          <div className="mb-6 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">Edit Your Profile</h1>
            <p className="text-sm text-gray-600">Make changes to your profile to better inform voters</p>
          </div>
          
          {/* Profile Header */}
          <div className="flex flex-col items-start text-left relative">
            <div className="w-[150px] h-[150px] rounded-full shadow-sm relative bg-gray-100 flex items-center justify-center overflow-hidden">
              <Image
                src={candidate.photo || "/default-profile.png"}
                width={150}
                height={150}
                alt={candidate.name}
                className="rounded-full"
              />
              {/* Future enhancement: Add photo upload button */}
            </div>

            <div className="mt-4 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="text-xl font-bold text-gray-900 border-gray-300 mb-2"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <Input
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className="text-sm font-medium text-gray-600 border-gray-300 mb-2"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Party *</label>
              <Input
                name="party"
                value={formData.party}
                onChange={handleChange}
                required
                className="text-sm font-semibold text-purple-600 border-gray-300"
              />
            </div>

            <div className="relative mt-2 mb-2">
              <div 
                className="relative cursor-pointer"
                onMouseEnter={() => setHovered("verification")}
                onMouseLeave={() => setHovered(null)}
              >
                {candidate.verified ? (
                  <div className="flex items-center">
                    <FaCheckCircle className="text-blue-500 mr-2" />
                    <span className="text-sm text-gray-600">This profile is verified</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FaCheckCircle className="text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">This profile is not yet verified</span>
                  </div>
                )}
                {hovered === "verification" && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-10">
                    {candidate.verified
                      ? "Your profile is verified"
                      : "Your profile is pending verification"}
                  </div>
                )}
              </div>
            </div>
          </div>
      
          {/* Social Links Inline */}
          <div className="mt-6 mb-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Social Media & Website</h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center">
                <FaGlobe className="text-blue-600 mr-3" />
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="w-full border-gray-300"
                />
              </div>
              <div className="flex items-center">
                <FaLinkedin className="text-blue-600 mr-3" />
                <Input
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full border-gray-300"
                />
              </div>
              <div className="flex items-center">
                <FaTwitter className="text-blue-400 mr-3" />
                <Input
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourhandle"
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </div>
      
          {/* Candidate Bio */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Biography*</h3>
            <Textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={5}
              className="w-full border-gray-300"
              placeholder="Share your background, experience, and qualifications..."
            />
          </div>
      
          {/* Policies */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Policies</h3>
            <p className="text-sm text-gray-600 mb-3">List the key policies you support or propose</p>
            
            <ul className="space-y-2 text-sm mb-4">
              {formData.policies.map((policy, index) => (
                <li key={index} className="flex items-center">
                  <span className="font-semibold flex-grow">✅ {policy}</span>
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => removePolicy(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTimes />
                  </Button>
                </li>
              ))}
            </ul>
            
            <div className="flex items-center gap-2">
              <Input
                value={newPolicy}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPolicy(e.target.value)}
                placeholder="Add a new policy..."
                className="w-full border-gray-300"
              />
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={addPolicy}
                className="whitespace-nowrap"
              >
                Add Policy
              </Button>
            </div>
          </div>
      
          {/* Additional Notes */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Additional Notes</h3>
            <Textarea
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleChange}
              rows={3}
              className="w-full border-gray-300"
              placeholder="Share any additional information you'd like voters to know..."
            />
          </div>

          {/* Location */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">City</label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">State</label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border-gray-300"
                />
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
              className="border-gray-300"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="purple"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>Saving...</>
              ) : (
                <>
                  <FaSave />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Preview sidebar - non-editable */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="w-full md:w-1/3 h-fit mt-24"
        >
            <div className="bg-white p-4">
            
            {/* Profile Preview */}
            <div className="mb-6 p-3 rounded">
              <div className="flex items-center gap-3">
              <Image
                src={candidate.photo || "/default-profile.png"}
                width={40}
                height={40}
                alt={formData.name}
                  className="rounded-full"
                />
                <div>
                  <div className="font-medium text-gray-900">{formData.name}</div>
                  <div className="text-xs text-gray-600">{formData.position}</div>
                  <div className="text-xs font-medium text-purple-600">{formData.party}</div>
                </div>
              </div>
            </div>
            
            {/* Election Context */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Election: {election?.position}</h3>
              <p className="text-xs text-gray-600 mb-2">Other candidates in this election:</p>
              
              {relatedCandidates.length > 0 ? (
                <div className="space-y-3">
                  {relatedCandidates.map((relatedCandidate) => (
                    <div key={relatedCandidate.id} className="flex items-center p-2 bg-gray-50 rounded">
                      <Image
                        src={relatedCandidate.photo || '/default-profile.png'}
                        width={30}
                        height={30}
                        alt={relatedCandidate.name}
                        className="rounded-full mr-2"
                      />
                      <div>
                        <div className="text-sm font-medium">{relatedCandidate.name}</div>
                        <div className="text-xs text-purple-600">{relatedCandidate.party}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No other candidates found.</p>
              )}
            </div>
            
            {/* Help Text */}
            <div className="rounded text-sm text-blue-800 whitespace-nowrap">
              <h4 className="font-medium mb-1">Tips for a Great Profile</h4>
              <ul className="list-disc list-inside text-xs space-y-1">
                <li>Be clear and specific about your policies</li>
                <li>Include relevant experience and background</li>
                <li>Add sources to increase credibility</li>
                <li>Include contact information and social media</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </form>
  );
}
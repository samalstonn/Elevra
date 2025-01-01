import React from "react";

// simulated
async function getCandidateData(id: string) {
  return {
    id,
    name: "Travis Brooks",
    position: "Running for District 1 - City Council",
    bio: "Travis Brooks is a community organizer with over 10 years of experience advocating for affordable housing and public safety reform. He currently serves as the director of a local nonprofit aimed at youth development.",
    policies: [
      "Supports increasing funding for public schools.",
      "Advocates for affordable housing initiatives in urban areas.",
      "Prioritizes public safety reforms to build trust with the community.",
    ],
    links: {
      website: "https://campaignwebsite.com",
      twitter: "https://twitter.com/travisbrooks",
    },
    verified: true,
  };
}

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateData(params.id); 

  return (
    <div className="bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-gray-800">{candidate.name}</h1>
        <p className="text-lg text-gray-600 mt-2">{candidate.position}</p>
        {candidate.verified && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full mt-2 inline-block">
            Verified
          </span>
        )}

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Bio Summary</h2>
          <p className="text-gray-600 mt-2">{candidate.bio}</p>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Key Policy Positions</h2>
          <ul className="list-disc list-inside mt-2 text-gray-600">
            {candidate.policies.map((policy, index) => (
              <li key={index}>{policy}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="text-xl font-semibold text-gray-800">Contact & Campaign</h2>
          <p className="text-gray-600 mt-2">
            <strong>Website:</strong>{" "}
            <a
              href={candidate.links.website}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit Campaign Website
            </a>
          </p>
          <p className="text-gray-600 mt-1">
            <strong>Social Media:</strong>{" "}
            <a
              href={candidate.links.twitter}
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}

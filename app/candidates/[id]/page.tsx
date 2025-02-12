
async function getCandidateData(id: string) {
    return {
        id,
        name: "Travis Brooks",
        position: "Running for District 1 – City Council",
        bio: "Travis Brooks is a community organizer with over 10 years of experience advocating for affordable housing and public safety reform.",
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
//   const res = await fetch(`https://api.example.com/candidates/${id}`, {
//     cache: 'no-store', // Adjust caching as needed
//   });
//   if (!res.ok) {
//     throw new Error('Failed to fetch candidate data');
//   }
//   return res.json();
}

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const candidate = await getCandidateData(id);

  return (
    <div className="bg-gray-100 flex flex-col justify-center items-center p-4">
      <h1 className="text-2xl font-bold mb-4">{candidate.name}</h1>
      <p className="text-lg">{candidate.position}</p>
      <div className="mt-4">
        <a
          href={candidate.links.website}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Donate to Campaign
        </a>
      </div>
    </div>
  );
}

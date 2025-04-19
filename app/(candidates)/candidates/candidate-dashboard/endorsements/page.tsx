import CandidateEndorsementsClient from "./EndorsementsClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function CandidateEndorsementsPage() {
  const user = await currentUser();
  if (!user?.id) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/candidate/endorsements?clerkUserId=${user.id}`
  );
  if (!res.ok) {
    console.error("Failed to fetch endorsements:", res.statusText);
    return (
      <CandidateEndorsementsClient
        user={{
          firstName: user.firstName,
          username: user.username,
          imageUrl: user.imageUrl,
        }}
        data={{ totalEndorsements: 0, endorsements: [] }}
      />
    );
  }
  const data = await res.json();

  return (
    <CandidateEndorsementsClient
      user={{
        firstName: user.firstName,
        username: user.username,
        imageUrl: user.imageUrl || "",
      }}
      data={data}
    />
  );
}

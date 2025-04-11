import CandidateDonationsClient from "./DonationsClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function CandidateDonationsPage() {
  const user = await currentUser();

  if (!user?.id) {
    return null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/candidate/donations?clerkUserId=${user.id}`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json();

  return (
    <CandidateDonationsClient
      user={{
        firstName: user.firstName,
        username: user.username,
        imageUrl: user.imageUrl,
      }}
      data={data}
    />
  );
}

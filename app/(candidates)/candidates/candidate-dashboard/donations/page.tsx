import CandidateDonationsClient from "./DonationsClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function CandidateDonationsPage() {
  const user = await currentUser();

  if (!user?.id) {
    return null;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/candidate/donations?clerkUserId=${user.id}`
  );
  console.log(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/candidate/donations?clerkUserId=${user.id}`
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

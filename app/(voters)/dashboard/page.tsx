import DashboardPageClient from "./DashboardClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user?.id) {
    return null;
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/candidate/donations?clerkUserId=${user.id}`
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error("Failed to fetch donations");
      }
      return res.json();
    })
    .catch((error) => {
      console.error("Error fetching donations:", error);
      return { totalDonations: 0, totalCandidatesSupported: 0, donations: [] };
    });

  return (
    <DashboardPageClient
      user={{
        firstName: user.firstName,
        username: user.username,
        imageUrl: user.imageUrl,
      }}
      data={res}
    />
  );
}

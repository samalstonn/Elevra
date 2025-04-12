import DashboardPageClient from "./DashboardClient";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user?.id) {
    return null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
    "http://localhost:3000";

  const res = await fetch(
    `${baseUrl}/api/voter/donations?clerkUserId=${user.id}`,
    {
      cache: "no-store",
    }
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

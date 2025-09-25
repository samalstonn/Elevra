"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

import { usePageTitle } from "@/lib/usePageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const tiles = [
  {
    href: "/admin/upload-spreadsheet",
    title: "Upload Candidates",
    description: "Create or update candidates by importing CSV spreadsheets.",
    cta: "Upload data",
  },
  {
    href: "/admin/search",
    title: "Search Directory",
    description: "Look up candidates and elections with detailed profiles.",
    cta: "Search data",
  },
  {
    href: "/admin/candidate-outreach",
    title: "Candidate Outreach",
    description: "Send candidate outreach emails.",
    cta: "Send emails",
  },
] as const;

export default function SubAdminHub() {
  usePageTitle("Admin – Sub Admin");
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading access…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 p-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Sub Admin Tools
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {tiles.map((tile) => (
          <Card
            key={tile.href}
            className="flex h-full flex-col justify-between"
          >
            <CardHeader>
              <CardTitle>{tile.title}</CardTitle>
              <CardDescription>{tile.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm">
                <Link href={tile.href}>{tile.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}

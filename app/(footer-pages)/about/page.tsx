import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AboutPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 pb-8">
      <h1 className="text-3xl md:text-4xl font-bold text-purple-800 mb-4">
        About Elevra
      </h1>
      <p className="text-base text-gray-700 mb-4">
        Elevra is a platform built for local elections. We help local candidates
        run professional, modern campaigns and make it simple for voters to see
        who&apos;s on their ballot and what they stand for.
      </p>
      <p className="text-base text-gray-700 mb-6">
        Elevra was started by Adam Rose and Sam Alston while they were students
        at Cornell University. The idea came when a friend ran for a local seat
        in Ithaca and there was no straightforward way to find or understand his
        campaign. That experience showed them a clear gap: candidates
        didn&apos;t have simple tools to reach voters, and voters didn&apos;t
        have one trusted place to learn about local races.
      </p>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        <div>
          <h2 className="text-2xl font-semibold text-purple-800 mb-4">
            The Founders
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Adam Rose graduated with a Bachelor of Science with Honors from
            Cornell&apos;s School of Industrial and Labor Relations, where he
            wrote his senior thesis on healthcare policy under Professor
            Rosemary Batt. He has worked in local town government and served as
            a Campaign Fellow on Senator Elissa Slotkin&apos;s 2022
            congressional re-election campaign.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Sam Alston studied Computer Science at Cornell and was a lightweight
            rower in the Varsity 8+, ultimately racing at the Henley Royal
            Regatta in England. He lives in New York City and is focused on
            building technology that empowers local candidates to run better,
            more organized campaigns.
          </p>
          <p className="text-gray-700 leading-relaxed">
            David Weinstein is an advisor with decades of media and production
            experience at companies like BuzzFeed, Complex Networks, CNBC, and
            CBS Sports. He first discovered Elevra while running for school
            board in Hastings-on-Hudson and joined as an advisor after using and
            loving the product as a candidate.
          </p>
        </div>

        <div className="flex justify-center">
          <Link
            href="/feedback"
            className="w-full max-w-xl overflow-hidden rounded-xl shadow-lg border border-gray-100 bg-white block group"
            aria-label="Contact Elevra"
          >
            <Image
              src="/elevra-founders.jpeg"
              alt="Two people holding up an Elevra sign and working on it."
              width={1200}
              height={800}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
              priority
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

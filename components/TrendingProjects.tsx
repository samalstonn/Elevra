import React from "react";
import { Card, CardContent, CardTitle, CardDescription } from "./Card";
import { Button } from "./ui";
import Image from 'next/image';

const TrendingProjects = () => {
  const nonprofits = [
    {
      name: "Hangar Theatre",
      mission:
        "A cultural cornerstone in Ithaca, the Hangar Theatre fosters creativity, education, and vibrant performances that inspire and uplift the community.",
      founded: "Founded in 1975",
      impact: "Serving 60,000+ audience members annually",
      address: "801 Taughannock Blvd, Ithaca, NY 14850",
      donationMessage: "Support the arts – Donate today!",
      image: "/hangar-theatre.jpg",
    },
    {
      name: "Beat for Good",
      mission:
        "A student-led initiative fighting cardiovascular disease through education, advocacy, and fundraising for the American Heart Association.",
      founded: "Founded in honor of Dr. Chris Garenani",
      impact: "Raising awareness and funds to prevent heart disease",
      address: "Cornell University & Villanova University",
      donationMessage: "Help hearts beat for good – Donate today!",
      image: "/beat-for-good.jpg",
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold">Local Non-Profit Organizations </h2>
      <p className="text-gray-600 text-sm sm:text-base">
        Support organizations making a difference in your community.
      </p>

      {/* Mobile: Vertical Scroll | Large Screens: Centered Scrollable Row */}
      <div className="flex flex-col sm:flex-row sm:overflow-x-auto sm:space-x-4 sm:pb-4 lg:justify-center">
        {nonprofits.map((org, index) => (
          <Card key={index} className="w-full sm:w-[300px] flex-shrink-0">
            <Image
              src={org.image} 
              alt={org.name}
              width={300}
              height={200}
              className="w-full h-40 sm:h-48 object-cover rounded-lg"
            />
            <CardContent>
              <CardTitle>{org.name}</CardTitle>
              <CardDescription>{org.mission}</CardDescription>
              <p className="text-xs sm:text-sm text-gray-600 mt-2">{org.founded}</p>
              <p className="text-xs text-gray-500 mt-1">{org.impact}</p>
              <p className="text-xs text-gray-500 mt-1">{org.address}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Navigation Buttons (Optional for Larger Screens) */}
      <div className="hidden sm:flex justify-between mt-4">
        <Button variant="outline" className="flex items-center space-x-2">
          <span>Previous</span>
        </Button>
        <Button variant="outline" className="flex items-center space-x-2">
          <span>Next</span>
        </Button>
      </div>
    </div>
  );
};

export default TrendingProjects;
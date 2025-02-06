import React from "react";
import { Card, CardContent, CardTitle, CardDescription } from "./Card";
import { Button } from "./ui";

const TrendingProjects = () => {
  const homes = [
    {
      price: "$525,000",
      beds: 4,
      baths: 3,
      sqft: "2,898 sqft",
      status: "Active",
      address: "15 Bean Hill Ln, Ithaca, NY, 14850",
      openHouse: "Open: Wed 4:30-6:30pm (1/29)",
      mls: "MLS ID #R1585320",
      listing: "Listing by: Warren Real Estate of Ithaca Inc., Kathleen (Kate) Seaman",
    },
    {
      price: "$1,950,000",
      beds: 6,
      baths: 6,
      sqft: "6,000 sqft",
      status: "Active",
      address: "520 Cayuga Heights Rd, Ithaca, NY, 14850",
      feature: "Koi pond and waterfall",
      mls: "MLS ID #S1570943",
      listing: "Listing by: Four Seasons Sotheby's Inter., Ellen O'Connor",
    },
    {
      price: "$598,000",
      beds: 4,
      baths: 3,
      sqft: "3,092 sqft",
      status: "Active",
      address: "313 Warren Rd, Ithaca, NY, 14850",
      feature: "Gas fireplace",
      mls: "MLS ID #R1569061",
      listing: "Listing by: Warren Real Estate of Ithaca Inc., Kathleen (Kate) Seaman",
    },
    {
      price: "$299,000",
      beds: 3,
      baths: 2,
      sqft: "1,820 sqft",
      status: "Active",
      address: "248 Seven Mile Dr, Ithaca, NY, 14850",
      feature: "Price cut: $20,000 (1/25)",
      mls: "MLS ID #R1582808",
      listing: "Listing by: Warren Real Estate of Ithaca Inc., Kathleen (Kate) Seaman",
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Trending Homes in Ithaca, NY</h2>
      <p className="text-gray-600">Viewed and saved the most in the area over the past 24 hours</p>
      <div className="flex space-x-4 overflow-x-auto">
        {homes.map((home, index) => (
          <Card key={index} className="min-w-[300px]">
            {home.openHouse && (
              <div className="bg-orange-500 text-white text-sm p-2">{home.openHouse}</div>
            )}
            {home.feature && (
              <div className="bg-orange-500 text-white text-sm p-2">{home.feature}</div>
            )}
            <img
              src="/download.jpeg" // Replace with real image paths
              alt="Home Image"
              className="w-full h-48 object-cover"
            />
            <CardContent>
              <CardTitle>{home.price}</CardTitle>
              <CardDescription>
                {home.beds} bds • {home.baths} ba • {home.sqft}
              </CardDescription>
              <p className="text-sm text-gray-600 mt-2">{home.address}</p>
              <p className="text-sm text-gray-500 mt-1">{home.mls}</p>
              <p className="text-sm text-gray-500 mt-1">{home.listing}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex justify-between mt-4">
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
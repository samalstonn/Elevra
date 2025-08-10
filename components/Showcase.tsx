import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, UserRound } from "lucide-react";
import Image from "next/image";

interface ShowcaseProps {
  title?: string;
}

// Define the content for each category
const showcaseContent = {
  voters: {
    title: "For Voters",
    description:
      "Discover local candidates who align with your values and the issues you care about.",
    imageUrl: "/voters-showcase.png",
  },
  campaigns: {
    title: "For Campaigns",
    description:
      "Connect with voters and access powerful tools to run an effective campaign.",
    imageUrl: "/campaigns-showcase.png",
  },
  vendors: {
    title: "For Vendors",
    description:
      "Offer your services to campaigns and grow your political business network.",
    imageUrl: "/vendors-showcase.png",
  },
};

type ContentType = "voters" | "campaigns" | "vendors";

const Showcase: React.FC<ShowcaseProps> = ({}) => {
  const [activeContent, setActiveContent] = useState<ContentType>("voters");
  const [imageError, setImageError] = useState<Record<ContentType, boolean>>({
    voters: false,
    campaigns: false,
    vendors: false,
  });

  const handleImageError = (type: ContentType) => {
    setImageError((prev) => ({
      ...prev,
      [type]: true,
    }));
  };

  return (
    <section className="w-screen py-12 bg-gray-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center mb-16 mt-16"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          How Elevra Works
        </h2>
      </motion.div>
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" },
            },
          }}
          className="flex flex-col items-center"
        >
          {/* Showcase Content Area */}
          <div className="w-full max-w-5xl mb-8 rounded-lg overflow-hidden shadow-lg">
            <div className="relative rounded-lg" style={{ minHeight: "200px" }}>
              {/* Try to load image first */}
              {!imageError[activeContent] && (
                <div className="flex justify-center">
                  <Image
                    width={1160}
                    height={706}
                    src={showcaseContent[activeContent].imageUrl}
                    alt={showcaseContent[activeContent].title}
                    style={{ width: "1160px", height: "auto" }}
                    className="rounded-lg shadow-[0_0_10px_rgba(0,0,0,0.3)] object-contain"
                    onError={() => handleImageError(activeContent)}
                  />
                </div>
              )}

              {/* Fallback text-only content if image fails to load */}
              {imageError[activeContent] && (
                <div
                  className="bg-gradient-to-r from-purple-100 to-purple-50 p-8 rounded-lg"
                  style={{ minHeight: "200px" }}
                >
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center max-w-2xl">
                      <h3 className="text-3xl font-bold text-purple-900 mb-4">
                        {showcaseContent[activeContent].title}
                      </h3>
                      <p className="text-xl text-gray-700">
                        {showcaseContent[activeContent].description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Buttons Section */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
            <Button
              variant={activeContent === "voters" ? "default" : "purple"}
              size="lg"
              className={`flex items-center gap-2 ${
                activeContent === "voters" ? "bg-purple-700" : ""
              }`}
              onClick={() => setActiveContent("voters")}
            >
              <Users size={20} />
              <span>For Voters</span>
            </Button>

            <Button
              variant={activeContent === "campaigns" ? "default" : "purple"}
              size="lg"
              className={`flex items-center gap-2 ${
                activeContent === "campaigns" ? "bg-purple-700" : ""
              }`}
              onClick={() => setActiveContent("campaigns")}
            >
              <UserRound size={20} />
              <span>For Campaigns</span>
            </Button>

            {/* <Button
              variant={activeContent === "vendors" ? "default" : "purple"}
              size="lg"
              className={`flex items-center gap-2 ${
                activeContent === "vendors" ? "bg-purple-700" : ""
              }`}
              onClick={() => setActiveContent("vendors")}
            >
              <ShoppingBag size={20} />
              <span>For Vendors</span>
            </Button> */}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Showcase;

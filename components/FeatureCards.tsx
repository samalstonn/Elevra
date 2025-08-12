import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FeatureCards = () => {
  const cardsSectionOne = [
    {
      title: "Drive The Change You Want",
      description:
        "Local officials can act fast, making decisions without the delays of big-government bureaucracy.",
      emoji: "🚀",
    },
    {
      title: "Build Neighborhood Connections",
      description:
        "Engage with local leaders, foster collaboration, and create a more connected, thriving community.",
      emoji: "👥",
    },
    {
      title: "If You Don’t Show Up, Someone Else Will",
      description:
        "Low-turnout elections mean a tiny group of voters decides everything. If you don’t vote, your loudest, most extreme neighbors will - and they’ll pick the people who run your life.",
      emoji: "⚠️",
    },
  ];

  const cardsSectionTwo = [
    {
      title: "Mayor Shapes Your Neighborhood",
      description:
        "They decide what gets built, where money flows, and who your city serves. Your block thrives - or it gets left behind.",
      emoji: "🏙️",
    },
    {
      title: "District Attorney Determines Your Safety",
      description:
        "They choose who faces charges and who walks free. They either protect your street or let danger back in.",
      emoji: "⚖️",
    },
    {
      title: "School Boards Control What Your Kids Learn",
      description:
        "They pick who teaches, what's taught, and which schools get funded - or left behind. If parents don’t vote, someone else shapes kids' education, safety, and future.",
      emoji: "🎓",
    },
  ];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.2 },
        },
      }}
      viewport={{ once: true }}
      className="w-screen pt-32 pb-16 px-6 bg-gray-100"
    >
      {/* First Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center mb-12"
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Why Get Involved With Local Elections
        </h2>
      </motion.div>

      {/* First Section Cards Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
          },
        }}
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {cardsSectionOne.map((card, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.6,
                  ease: "easeInOut",
                  delay: index * 0.1,
                },
              },
            }}
            whileHover={{
              scale: 1.04,
              transition: { type: "spring", stiffness: 100 },
            }}
            whileTap={{
              scale: 0.97,
              transition: { type: "spring", stiffness: 200 },
            }}
            className="border rounded-lg shadow-md bg-white p-5 flex flex-col items-center text-center h-64 transition-all"
          >
            <motion.span
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                visible: {
                  scale: 1,
                  opacity: 1,
                  transition: { duration: 0.4, delay: index * 0.1 + 0.2 },
                },
              }}
              className="text-4xl mb-3"
            >
              {card.emoji}
            </motion.span>
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm flex-grow">
              {card.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Second Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center mt-24 mb-12 "
      >
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          What Do Local Politicians Decide?
        </h2>
      </motion.div>

      {/* Second Section Cards Grid */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 },
          },
        }}
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
      >
        {cardsSectionTwo.map((card, index) => (
          <motion.div
            key={index}
            variants={{
              hidden: { opacity: 0, y: 30, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.6,
                  ease: "easeInOut",
                  delay: index * 0.1,
                },
              },
            }}
            whileHover={{
              scale: 1.04,
              transition: { type: "spring", stiffness: 100 },
            }}
            whileTap={{
              scale: 0.97,
              transition: { type: "spring", stiffness: 200 },
            }}
            className="border rounded-lg shadow-md bg-white p-5 flex flex-col items-center text-center h-64 transition-all"
          >
            <motion.span
              variants={{
                hidden: { scale: 0.8, opacity: 0 },
                visible: {
                  scale: 1,
                  opacity: 1,
                  transition: { duration: 0.4, delay: index * 0.1 + 0.2 },
                },
              }}
              className="text-4xl mb-3"
            >
              {card.emoji}
            </motion.span>
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600 text-sm flex-grow">
              {card.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
      <div className="flex flex-col items-center w-full overflow-x-hidden mx-auto">
        <Button variant="purple" size="xxl" className="mt-12">
          <Link href={"/live-elections"}>
            <span className="hidden md:inline">Check Out What&apos;s Live</span>
            <span className="md:hidden">📊</span>
          </Link>
        </Button>
      </div>
    </motion.section>
  );
};

export default FeatureCards;

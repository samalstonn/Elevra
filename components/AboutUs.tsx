import React from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="w-full pt-16 pb-32 px-6 overflow-x-hidden"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
        viewport={{ once: true }}
        className="text-2xl sm:text-3xl font-extrabold text-black text-center"
      >
        In 375 BC, Plato Wrote in &ldquo;The Republic&rdquo;...
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.4 }}
        viewport={{ once: true }}
        className="mt-12 mx-[10%] text-lg sm:text-xl text-gray-700 text-center"
      >
        &ldquo;No one in any position of rule, insofar as he is a ruler, seeks
        or orders what is advantageous to himself, but what is advantageous to
        his subjects.&rdquo;
        <br />
        <br />
        <em className="text-md">- Find the Right Candidate on Elevra</em>
      </motion.p>

      {/* Section Spacer */}
      <div className="mt-24"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto"
      >
        {/* Header Section */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-black text-center">
          About Elevra
        </h2>

        <p className="mt-6 text-lg sm:text-xl text-gray-700 text-center">
          Elevra was built to simplify local elections. Our platform helps
          candidates create campaign pages that scale with their needs - from
          simple public profiles to advanced, data-driven pages. Voters can
          instantly find campaigns by searching their ZIP code or explore
          elections across the country. Elevra brings local elections together
          in one place.
        </p>
      </motion.div>
    </motion.section>
  );
};

export default AboutUs;

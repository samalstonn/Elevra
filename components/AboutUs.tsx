import React from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 50 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="w-screen bg-gray-100 py-32 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center"
      >
        {/* Header Section */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          About Elevra
        </h2>
        <p className="mt-6 text-lg text-gray-600">
          Founded by a group of students and faculty at Cornell University, 
          Elevra’s purpose is to empower local democracy through connection, 
          privacy, and impact. Elevra is a nonpartisan platform that helps 
          citizens discover and support verified local campaigns 
          by providing objective information and enabling quick donations so 
          that you can build your community.
        </p>
      </motion.div>

      {/* Section Spacer */}
      <div className="mt-24"></div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center"
      >
        How You Can Build Your Community
      </motion.h2>

      {/* Features Grid */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {[
          { emoji: "🧠", title: "Contribute Smarter", text: "Support verified candidates with confidence." },
          { emoji: "⚡", title: "Contribute Faster", text: "Quickly support issues you care about." },
          { emoji: "🚫", title: "Spam Free", text: "Choose personal information you share." },
          { emoji: "📊", title: "Quantify", text: "Track impact on your community." }
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-xl shadow-md p-8 text-center transition-transform"
          >
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: index * 0.15 + 0.2 }}
              className="text-4xl"
            >
              {card.emoji}
            </motion.span>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              {card.title}
            </h3>
            <p className="mt-2 text-gray-600">{card.text}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default AboutUs;
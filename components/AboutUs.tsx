import React from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 30 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="w-screen bg-gray-100 pt-32 pb-32 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.2 }}
        viewport={{ once: true }}
        className="max-w-5xl mx-auto text-center"
      >
        {/* Header Section */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
          About Elevra
        </h2>
        <p className="mt-6 text-lg text-gray-600">
          Elevra was founded by students and faculty at Cornell University to put 
          power in the hands of local communities. We make it easy to discover and 
          support verified local candidates with objective information and seamless 
          donations—all in one place.
        </p>
      </motion.div>

      {/* Section Spacer */}
      <div className="mt-24"></div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center"
      >
        Why Use Elevra?
      </motion.h2>

      {/* Features Grid with Smooth Stagger Effect */}
      <motion.div 
        initial="hidden"
        whileInView="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.25 },
          }
        }}
        viewport={{ once: true }}
        className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
      >
        {[
          { emoji: "🧠", title: "Contribute Smarter", text: "Make informed, data-driven decisions about which candidates to support." },
          { emoji: "⚡", title: "Donate Faster", text: "Our streamlined platform gets your contribution to local campaigns in just a few clicks." },
          { emoji: "📊", title: "Quantify Impact", text: "Track how your donations are being put to work in your community." }
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeInOut", delay: index * 0.15 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 100 } }}
            whileTap={{ scale: 0.98, transition: { type: "spring", stiffness: 200 } }}
            className="bg-white rounded-xl shadow-md p-8 text-center transition-transform"
          >
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeInOut", delay: index * 0.15 + 0.2 }}
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
      </motion.div>
    </motion.section>
  );
};

export default AboutUs;
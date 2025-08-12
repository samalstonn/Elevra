import React from "react";
import { motion } from "framer-motion";

const AboutUs = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="w-screen pt-16 pb-32 px-6"
    >
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.3 }}
        viewport={{ once: true }}
        className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center"
      >
        Mission Statement
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeInOut", delay: 0.4 }}
        viewport={{ once: true }}
        className="mt-6 text-lg text-gray-600 text-center"
      >
        Elevra makes running local elections simple and connect voters with the
        campaigns that shape their communities.
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
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center">
          About Elevra
        </h2>
        <p className="mt-6 text-lg text-gray-600 text-center">
          Founded by students and faculty at Cornell University, Elevra was
          created to remove the barriers that keep people from running for local
          office and to make it easier for voters to engage with elections that
          matter most. Our team’s firsthand experience in local government,
          congressional campaigns, and community leadership has shaped a
          platform where: <br />
        </p>
        <p className="text-lg text-gray-600 mt-2 pl-20 pr-20">
          1. Any voter can enter a ZIP code and instantly see who’s running for
          what in their community. <br />
          2. Candidates can launch and manage their campaigns without juggling
          expensive tools or disconnected resources. By putting all the
          essentials in one place, Elevra makes local elections more accessible,
          efficient, and connected for everyone.
        </p>
      </motion.div>
    </motion.section>
  );
};

export default AboutUs;

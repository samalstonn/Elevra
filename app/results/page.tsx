"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/Card";
import { Button } from "../../components/ui";
import { 
  Search, 
  Filter, 
  Globe, 
  Users, 
  Handshake, 
  HeartHandshake, 
  BookHeart, 
  HelpingHand 
} from "lucide-react";

export default function NonprofitResults() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="p-8 max-w-6xl mx-auto"
    >
      {/* Page Header */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
        className="text-4xl font-bold text-center text-gray-900"
      >
        Discover Nonprofits & Make an Impact
      </motion.h1>
      
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mt-8 flex items-center bg-white border border-gray-300 p-4 rounded-full shadow-lg"
      >
        <Search className="text-gray-500 mr-3 w-6 h-6" />
        <input
          type="text"
          placeholder="Search for nonprofits, causes, or volunteer opportunities"
          className="w-full border-none outline-none text-lg text-gray-700 placeholder-gray-500"
        />
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        viewport={{ once: true }}
        className="flex flex-wrap justify-center gap-4 mt-6"
      >
        {["Location", "Volunteer Opportunities", "Donations Needed", "Clean Energy", "Community Programs"].map((filter, index) => (
          <Button
            key={index}
            variant="outline"
            className="flex items-center gap-2 border-gray-400 text-gray-700 hover:bg-purple-600 hover:text-white transition-all"
          >
            <Filter size={16} />
            {filter}
          </Button>
        ))}
      </motion.div>

      {/* Nonprofit Cards Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        viewport={{ once: true }}
        className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {[
          { icon: Globe, title: "Global Environmental Action", description: "Working towards a greener and more sustainable planet." },
          { icon: Users, title: "Local Community Outreach", description: "Assisting underserved neighborhoods with essential services." },
          { icon: Handshake, title: "Social Justice Advocacy", description: "Promoting equality and human rights initiatives." },
          { icon: HeartHandshake, title: "Disaster Relief Coalition", description: "Providing emergency aid and support in crisis areas." },
          { icon: BookHeart, title: "Education for All", description: "Ensuring every child has access to quality education." },
          { icon: HelpingHand, title: "Mental Health Support Network", description: "Providing mental health resources and counseling." }
        ].map((nonprofit, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <Card className="group hover:shadow-xl transition-all rounded-xl">
              <CardContent className="p-6 text-center flex flex-col items-center">
                <nonprofit.icon className="w-12 h-12 text-purple-600 mb-4 group-hover:scale-110 transition-transform" />
                <h2 className="text-xl font-semibold text-gray-900">{nonprofit.title}</h2>
                <p className="text-gray-600 mt-2">{nonprofit.description}</p>
                <Button className="mt-4 bg-purple-600 text-white hover:bg-purple-700 transition-all">Support</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
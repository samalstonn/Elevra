import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const FeatureCards = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      viewport={{ once: true }}
      className="w-full pt-32 pb-16 px-6 bg-gray-100 mx-auto overflow-x-hidden"
    >
      <div className="flex flex-col items-center w-full overflow-x-hidden mx-auto">
        <Button variant="purple" size="xxl" className="mt-12">
          <Link href="/live-elections">
            <span className="hidden md:inline">Check Out What&apos;s Live</span>
            <span className="md:hidden">📊</span>
          </Link>
        </Button>
      </div>
    </motion.section>
  );
};

export default FeatureCards;

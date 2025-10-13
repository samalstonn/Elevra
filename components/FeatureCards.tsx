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
      className="w-full pt-4 pb-16 px-6 mx-auto overflow-x-hidden"
    >
      <div className="flex flex-col items-center w-full overflow-x-hidden mx-auto">
        <Button variant="purple" size="xl" className="mt-12 py-4">
          <Link href="/live-elections">
            <span className="">Explore Live Elections</span>
          </Link>
        </Button>
      </div>
    </motion.section>
  );
};

export default FeatureCards;

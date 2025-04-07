// VendorCategoryFilters.tsx
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";
import { ServiceCategoryFilterItem } from "@/types/vendor";

export interface VendorCategoryFilterProps {
  categories: ServiceCategoryFilterItem[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

export function VendorCategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
}: VendorCategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Animation Variants
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
  };

  const updateScrollButtons = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) {
      updateScrollButtons();
      scroller.addEventListener("scroll", updateScrollButtons);
      window.addEventListener("resize", updateScrollButtons);
      return () => {
        scroller.removeEventListener("scroll", updateScrollButtons);
        window.removeEventListener("resize", updateScrollButtons);
      };
    }
  }, [categories]);

  return (
    <div className="relative">
      <motion.div
        ref={scrollRef}
        variants={fadeInVariants}
        className="flex flex-nowrap overflow-x-auto gap-3 p-3 no-scrollbar"
      >
        <div
          onClick={() => onCategoryChange(null)}
          className={`flex h-8 shrink-0 items-center justify-center rounded-xl ${
            selectedCategoryId === null
              ? "bg-purple-100 text-purple-700"
              : "bg-[#f2f0f4] text-[#141118]"
          } px-4 text-sm font-medium cursor-pointer`}
        >
          All
        </div>

        {categories.map((category) => (
          <div
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex h-8 shrink-0 items-center justify-center rounded-xl ${
              selectedCategoryId === category.id
                ? "bg-purple-100 text-purple-700"
                : "bg-[#f2f0f4] text-[#141118]"
            } px-4 text-sm font-medium cursor-pointer`}
          >
            {category.name}
          </div>
        ))}
      </motion.div>

      {/* Gradient overlays for scrolling indication */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute top-0 left-0 h-full w-12 z-0"
          style={{
            background:
              "linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      )}

      {canScrollRight && (
        <div
          className="pointer-events-none absolute top-0 right-0 h-full w-12 z-0"
          style={{
            background:
              "linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0) 100%)",
          }}
        />
      )}

      {/* Scroll buttons */}
      {canScrollLeft && (
        <Button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hover:bg-transparent"
          variant="ghost"
          size="sm"
        >
          <FaChevronLeft className="w-4 h-4" />
        </Button>
      )}

      {canScrollRight && (
        <Button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hover:bg-transparent"
          variant="ghost"
          size="sm"
        >
          <FaChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

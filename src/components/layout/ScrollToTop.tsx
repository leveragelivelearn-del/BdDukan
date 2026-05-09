"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after 300px scroll
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 30 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3, ease: "backOut" }}
          className="fixed bottom-4 right-3 z-50 md:bottom-6 md:right-4"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="rounded-lg shadow-2xl hover:shadow-primary/30 h-8 w-8 md:h-9 md:w-9 bg-primary text-primary-foreground border-2 border-background"
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-4 w-4 stroke-[3]" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

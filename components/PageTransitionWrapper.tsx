// src/components/PageTransitionWrapper.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react"; // Removed unused useEffect, useState for this version
import { useTransitionStore } from "@/utils/transitionStore"; // Adjust path

const animatedPageVariants = {
  initial: { opacity: 0, x: "-20px" }, // New page STARTS here (faded out)
  animate: { opacity: 1, x: 0 },        // New page ANIMATES to here (fully visible)
  exit: { opacity: 0, x: "20px" },    // Old page FADES OUT to here
};

const instantPageVariants = {
  initial: { opacity: 1, x: 0 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 }, // Effectively, no exit animation for non-AI transitions
};

const pageTransitionConfig = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.8, // Your desired (slower) duration
};

const PageTransitionWrapper = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  // Get the raw values from the store. These will determine variants/transitions directly.
  const { animateNextTransition, consumeAiNavigationAnimation } = useTransitionStore();

  const currentVariants = animateNextTransition ? animatedPageVariants : instantPageVariants;
  const currentTransition = animateNextTransition ? pageTransitionConfig : { duration: 0 }; // No duration if not animating

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={currentVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={currentTransition}
        style={{ position: 'relative', width: '100%' }}
        onAnimationComplete={(definition) => {
          // 'definition' will be "initial", "animate", or "exit"
          // We want to consume the trigger after the *new page's entry animation* ("animate") is complete.
          if (definition === "animate" && animateNextTransition) {
            consumeAiNavigationAnimation();
          }
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransitionWrapper;
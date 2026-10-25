"use client";

import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/aceternity/aurora-background";
import { SignUpForm } from "./sign-up";

export default function SignUpPage() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center min-h-screen px-4"
      >
        <div className="w-full max-w-md">
          <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-gray-200">
            <SignUpForm />
          </div>
        </div>
      </motion.div>
    </AuroraBackground>
  );
}

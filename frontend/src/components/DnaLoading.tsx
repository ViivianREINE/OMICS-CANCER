"use client";
import React from "react";
import { motion } from "framer-motion";

export default function DnaLoading({ message = "Processing transcriptomic data..." }: { message?: string }) {
  const dots = 12;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="relative flex items-center justify-center h-24 w-72 mb-6">
        {Array.from({ length: dots }).map((_, i) => {
          const delay = i * 0.15;
          return (
            <div
              key={i}
              className="absolute flex flex-col items-center justify-between"
              style={{
                left: `${(i / (dots - 1)) * 100}%`,
                height: "100%",
                width: "4px",
              }}
            >
              {/* Strand A Node */}
              <motion.div
                className="w-3.5 h-3.5 rounded-full"
                style={{ background: "var(--dusty-rose)" }}
                animate={{
                  y: [0, 60, 0],
                  scale: [1, 0.7, 1.2, 1],
                  opacity: [0.9, 0.4, 1, 0.9],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay,
                }}
              />

              {/* Connecting hydrogen bond bar */}
              <motion.div
                className="w-0.5 flex-1 bg-gradient-to-b"
                style={{
                  backgroundImage: "linear-gradient(to bottom, var(--dusty-rose), var(--lavender))",
                  opacity: 0.18,
                }}
                animate={{
                  scaleY: [1, 0.1, 1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay,
                }}
              />

              {/* Strand B Node */}
              <motion.div
                className="w-3.5 h-3.5 rounded-full"
                style={{ background: "var(--lavender)" }}
                animate={{
                  y: [60, 0, 60],
                  scale: [0.7, 1.2, 0.7, 0.7],
                  opacity: [0.4, 1, 0.4, 0.4],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: delay,
                }}
              />
            </div>
          );
        })}
      </div>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="text-[var(--mocha)] text-sm font-medium tracking-wide"
        style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1.1rem" }}
      >
        {message}
      </motion.p>
    </div>
  );
}

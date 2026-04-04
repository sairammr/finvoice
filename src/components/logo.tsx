"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={className}>
      <motion.div
        className="flex items-center gap-2.5 select-none cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        whileHover="hover"
      >
        <motion.div
          className="relative -mx-2 flex h-14 w-14 shrink-0 items-center justify-center"
          variants={{ hover: { x: 1.5 } }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <Image
            src="/logo-white.svg"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 object-contain invert"
          />
        </motion.div>

        <motion.span
          className="font-heading text-4xl text-gray-900"
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.12, ease: "easeOut" }}
          variants={{ hover: { x: 1 } }}
          aria-label="Hedsup"
        >
          heds
          <motion.span
            className="text-lime-500 font-normal"
            variants={{ hover: { color: "#65a30d" } }}
          >
            up
          </motion.span>
          .fi
        </motion.span>
      </motion.div>
    </Link>
  );
}

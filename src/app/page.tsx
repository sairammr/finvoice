"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { HeroLogoMaskVideo } from "@/components/hero-logo-mask-video";
import {
  ArrowRight,
  FileText,
  Shield,
  Brain,
  TrendingUp,
  Zap,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Presentation,
  Truck,
  Building2,
  Wallet,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─────────────────────────────────────────────────────────
   Role card SVG animations
───────────────────────────────────────────────────────── */

function SupplierAnim() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <svg ref={ref} viewBox="0 0 200 96" fill="none" className="w-full h-full">
      {/* Invoice document */}
      <motion.rect
        x="10"
        y="8"
        width="58"
        height="76"
        rx="5"
        fill="#f7fee7"
        stroke="#bef264"
        strokeWidth="1.5"
        initial={{ opacity: 0, y: 6 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.35 }}
      />
      {/* Fold corner */}
      <motion.path
        d="M56 8 L68 20 L56 20 Z"
        fill="#d9f99d"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      />
      <motion.path
        d="M56 8 L68 20"
        stroke="#bef264"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 0.2, duration: 0.2 }}
      />
      {/* Doc lines */}
      {[28, 39, 50, 61, 72].map((y, i) => (
        <motion.line
          key={y}
          x1="18"
          y1={y}
          x2={i < 4 ? 60 : 50}
          y2={y}
          stroke="#a3e635"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: 0.25 + i * 0.07, duration: 0.25 }}
        />
      ))}
      {/* Invoice label in doc */}
      <motion.text
        x="39"
        y="19"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill="#65a30d"
        letterSpacing="1"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.45 }}
      >
        INVOICE
      </motion.text>
      {/* Flowing dots left → right */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          r="3.5"
          cy="48"
          fill="#a3e635"
          initial={{ cx: 80, opacity: 0 }}
          animate={inView ? { cx: [80, 126], opacity: [0, 1, 0] } : {}}
          transition={{
            delay: 0.9 + i * 0.22,
            duration: 0.75,
            repeat: Infinity,
            repeatDelay: 1.4,
            ease: "easeInOut",
          }}
        />
      ))}
      {/* Arrowhead */}
      <motion.path
        d="M118 41 L127 48 L118 55"
        stroke="#a3e635"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.75 }}
      />
      {/* Coin */}
      <motion.circle
        cx="162"
        cy="48"
        r="26"
        fill="#fefce8"
        stroke="#a3e635"
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.6, type: "spring", stiffness: 220, damping: 18 }}
        style={{ transformOrigin: "162px 48px" }}
      />
      <motion.text
        x="162"
        y="56"
        textAnchor="middle"
        fontSize="24"
        fontWeight="800"
        fill="#3f6212"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      >
        $
      </motion.text>
      {/* Pulse ring 1 */}
      <motion.circle
        cx="162"
        cy="48"
        r="26"
        stroke="#a3e635"
        strokeWidth="1.5"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={inView ? { scale: [1, 1.55], opacity: [0.6, 0] } : {}}
        transition={{
          delay: 1.1,
          duration: 1.1,
          repeat: Infinity,
          repeatDelay: 0.9,
        }}
        style={{ transformOrigin: "162px 48px" }}
      />
      {/* Pulse ring 2 (offset) */}
      <motion.circle
        cx="162"
        cy="48"
        r="26"
        stroke="#a3e635"
        strokeWidth="1"
        fill="none"
        initial={{ scale: 1, opacity: 0 }}
        animate={inView ? { scale: [1, 1.9], opacity: [0.3, 0] } : {}}
        transition={{
          delay: 1.5,
          duration: 1.3,
          repeat: Infinity,
          repeatDelay: 0.7,
        }}
        style={{ transformOrigin: "162px 48px" }}
      />
    </svg>
  );
}

function DebtorAnim() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <svg ref={ref} viewBox="0 0 200 96" fill="none" className="w-full h-full">
      {/* PDF document */}
      <motion.rect
        x="62"
        y="6"
        width="62"
        height="82"
        rx="5"
        fill="#fafafa"
        stroke="#d1d5db"
        strokeWidth="1.5"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.35 }}
      />
      {/* PDF header bar */}
      <motion.rect
        x="62"
        y="6"
        width="62"
        height="20"
        rx="5"
        fill="#e5e7eb"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.15 }}
      />
      {/* bottom of header fill (covers rounded bottom corners of header) */}
      <motion.rect
        x="62"
        y="18"
        width="62"
        height="8"
        fill="#e5e7eb"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.15 }}
      />
      <motion.text
        x="93"
        y="20"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="#6b7280"
        letterSpacing="1.5"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.25 }}
      >
        PDF
      </motion.text>
      {/* Doc content lines */}
      {[36, 46, 56, 66, 76].map((y, i) => (
        <motion.line
          key={y}
          x1="70"
          y1={y}
          x2={i < 4 ? 116 : 103}
          y2={y}
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.22 }}
        />
      ))}
      {/* Shield — left side */}
      <motion.path
        d="M16 30 Q16 20 28 16 Q40 20 40 30 L40 46 Q40 56 28 61 Q16 56 16 46 Z"
        fill="#f9fafb"
        stroke="#9ca3af"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{
          delay: 0.45,
          duration: 0.35,
          type: "spring",
          stiffness: 200,
        }}
        style={{ transformOrigin: "28px 38px" }}
      />
      {/* Lock body */}
      <motion.rect
        x="22"
        y="40"
        width="12"
        height="10"
        rx="2"
        fill="#9ca3af"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.7 }}
      />
      {/* Lock shackle */}
      <motion.path
        d="M24 40 Q24 34 28 34 Q32 34 32 40"
        stroke="#9ca3af"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 0.55, duration: 0.3 }}
      />
      <motion.text
        x="28"
        y="80"
        textAnchor="middle"
        fontSize="7"
        fontWeight="600"
        fill="#9ca3af"
        letterSpacing="0.8"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.9 }}
      >
        PRIVATE
      </motion.text>
      {/* Approval circle — right side */}
      <motion.circle
        cx="168"
        cy="38"
        r="22"
        fill="#f0fdf4"
        stroke="#86efac"
        strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={inView ? { scale: 1, opacity: 1 } : {}}
        transition={{ delay: 0.8, type: "spring", stiffness: 240, damping: 16 }}
        style={{ transformOrigin: "168px 38px" }}
      />
      {/* Checkmark */}
      <motion.path
        d="M158 38 L165 45 L179 27"
        stroke="#16a34a"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 1.05, duration: 0.4, ease: "easeOut" }}
      />
      <motion.text
        x="168"
        y="72"
        textAnchor="middle"
        fontSize="7"
        fontWeight="600"
        fill="#16a34a"
        letterSpacing="0.8"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.3 }}
      >
        APPROVED
      </motion.text>
      {/* Connecting lines from doc to shield and approval */}
      <motion.line
        x1="62"
        y1="38"
        x2="40"
        y2="38"
        stroke="#e5e7eb"
        strokeWidth="1"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 0.6, duration: 0.3 }}
      />
      <motion.line
        x1="124"
        y1="38"
        x2="146"
        y2="38"
        stroke="#e5e7eb"
        strokeWidth="1"
        strokeDasharray="3 2"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 0.9, duration: 0.3 }}
      />
    </svg>
  );
}

function FunderAnim() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const bars = [
    { x: 16, h: 30, fill: "#d9f99d" },
    { x: 52, h: 46, fill: "#bef264" },
    { x: 88, h: 62, fill: "#a3e635" },
    { x: 124, h: 74, fill: "#84cc16" },
  ] as const;
  const BL = 88; // baseline y

  const lineD = bars.map((b) => `${b.x + 14},${BL - b.h}`).join(" L ");

  return (
    <svg ref={ref} viewBox="0 0 200 96" fill="none" className="w-full h-full">
      {/* Subtle grid */}
      {[BL - 25, BL - 50, BL - 74].map((y) => (
        <line
          key={y}
          x1="10"
          y1={y}
          x2="165"
          y2={y}
          stroke="#f3f4f6"
          strokeWidth="1"
          strokeDasharray="4 3"
        />
      ))}
      {/* Baseline */}
      <line x1="10" y1={BL} x2="165" y2={BL} stroke="#e5e7eb" strokeWidth="1" />
      {/* Bars */}
      {bars.map((bar, i) => (
        <motion.rect
          key={i}
          x={bar.x}
          y={BL - bar.h}
          width="28"
          height={bar.h}
          rx="4"
          fill={bar.fill}
          initial={{ scaleY: 0 }}
          animate={inView ? { scaleY: 1 } : {}}
          transition={{ delay: 0.2 + i * 0.13, duration: 0.5, ease: "easeOut" }}
          style={{ transformOrigin: `${bar.x + 14}px ${BL}px` }}
        />
      ))}
      {/* Trend line */}
      <motion.polyline
        points={lineD}
        stroke="#3f6212"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ delay: 0.85, duration: 0.65, ease: "easeOut" }}
      />
      {/* Dots on bar tops */}
      {bars.map((bar, i) => (
        <motion.circle
          key={i}
          cx={bar.x + 14}
          cy={BL - bar.h}
          r="3.5"
          fill="white"
          stroke="#3f6212"
          strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={{ delay: 0.95 + i * 0.1, type: "spring", stiffness: 300 }}
          style={{ transformOrigin: `${bar.x + 14}px ${BL - bar.h}px` }}
        />
      ))}
      {/* APY badge */}
      <motion.rect
        x="168"
        y="12"
        width="26"
        height="40"
        rx="7"
        fill="#f7fee7"
        stroke="#a3e635"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.25, type: "spring", stiffness: 220 }}
        style={{ transformOrigin: "181px 32px" }}
      />
      <motion.text
        x="181"
        y="31"
        textAnchor="middle"
        fontSize="13"
        fontWeight="800"
        fill="#3f6212"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.45 }}
      >
        26%
      </motion.text>
      <motion.text
        x="181"
        y="44"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#65a30d"
        letterSpacing="0.5"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.55 }}
      >
        APY
      </motion.text>
      {/* Upward arrow on badge */}
      <motion.path
        d="M181 56 L181 64 M177 60 L181 56 L185 60"
        stroke="#a3e635"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.6 }}
      />
    </svg>
  );
}


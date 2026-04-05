"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  ShieldOff,
  Frown,
  Lock,
  Globe,
  Building2,
  Rocket,
  Handshake,
  Check,
  X,
  ArrowRight,
  Home,
  Cpu,
  EyeOff,
  Binary,
  Layers,
  Target,
  Users,
  Megaphone,
  TrendingUp,
} from "lucide-react";
import { HeroLogoMaskVideo } from "@/components/hero-logo-mask-video";

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut" as const,
    },
  }),
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: "easeOut" as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Slide wrapper with InView animation                                */
/* ------------------------------------------------------------------ */

function Slide({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { amount: 0.45 });

  return (
    <section
      ref={ref}
      data-slide={index}
      className="h-screen snap-start flex items-center justify-center relative"
    >
      <motion.div
        className="max-w-[1200px] w-full px-8 md:px-20"
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={stagger}
      >
        {children}
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section label                                                      */
/* ------------------------------------------------------------------ */

function SectionLabel({ text, i = 0 }: { text: string; i?: number }) {
  return (
    <motion.p
      variants={fadeUp}
      custom={i}
      className="text-sm font-mono tracking-widest uppercase text-lime-400 mb-4"
    >
      {text}
    </motion.p>
  );
}

/* ------------------------------------------------------------------ */
/*  Pill badge                                                         */
/* ------------------------------------------------------------------ */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/60">
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Solution slide — abstract animated diagram                         */
/* ------------------------------------------------------------------ */

function SolutionAbstractVisual() {
  return (
    <div
      className="relative w-full max-w-[min(100%,420px)] mx-auto lg:mx-0 lg:ml-auto aspect-5/4 select-none"
      aria-hidden
    >
      <svg
        viewBox="0 0 440 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_40px_rgba(163,230,53,0.08)]"
      >
        <defs>
          <linearGradient id="sol-vault-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="sol-market-grad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#a3e635" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.04" />
          </linearGradient>
          <filter id="sol-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Private vault */}
        <rect
          x="24"
          y="88"
          width="118"
          height="184"
          rx="18"
          fill="url(#sol-vault-grad)"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.25"
        />
        <rect
          x="24"
          y="88"
          width="118"
          height="184"
          rx="18"
          fill="none"
          stroke="#a3e635"
          strokeWidth="1.5"
          strokeOpacity="0"
        >
          <animate
            attributeName="stroke-opacity"
            values="0;0.35;0"
            dur="3.5s"
            repeatCount="indefinite"
          />
        </rect>
        {/* Lock centered in private panel (panel cx=83, cy=180) */}
        <path
          d="M67 178v-12a16 16 0 0 1 32 0v12"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect
          x="61"
          y="178"
          width="44"
          height="32"
          rx="5"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="2.5"
        />
        <circle cx="83" cy="194" r="4" fill="rgba(255,255,255,0.25)" />

        {/* Public / liquidity */}
        <rect
          x="298"
          y="88"
          width="118"
          height="184"
          rx="18"
          fill="url(#sol-market-grad)"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.25"
        />
        {/* Bars centered in public panel (panel cx=357, cy=180); group bbox vertically centered */}
        {[0, 1, 2, 3].map((i) => {
          const barW = 10;
          const gap = 6;
          const h = 18 + i * 14;
          const baseY = 210;
          const x0 = 357 - (4 * barW + 3 * gap) / 2;
          return (
            <rect
              key={i}
              x={x0 + i * (barW + gap)}
              y={baseY - h}
              width={barW}
              height={h}
              rx="2"
              fill="#a3e635"
              fillOpacity={0.15 + i * 0.12}
            >
              <animate
                attributeName="fill-opacity"
                values={`${0.12 + i * 0.08};${0.35 + i * 0.1};${0.12 + i * 0.08}`}
                dur={`${2.2 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </rect>
          );
        })}

        {/* Connection paths (shared geometry with motion paths below) */}
        <path
          id="sol-path-left"
          d="M 132 180 C 172 172 196 168 218 180"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />
        <path
          d="M 132 180 C 172 172 196 168 218 180"
          stroke="#a3e635"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 9"
          strokeOpacity="0.55"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-28"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </path>

        <path
          id="sol-path-right"
          d="M 222 180 C 262 188 286 172 310 180"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />
        <path
          d="M 222 180 C 262 188 286 172 310 180"
          stroke="#a3e635"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="5 9"
          strokeOpacity="0.55"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="28"
            dur="1.4s"
            repeatCount="indefinite"
          />
        </path>

        {/* Agent hub */}
        <g filter="url(#sol-glow)">
          <circle
            cx="220"
            cy="180"
            r="52"
            stroke="#a3e635"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="10 14"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 220 180"
              to="360 220 180"
              dur="18s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="220"
            cy="180"
            r="38"
            fill="rgba(163,230,53,0.06)"
            stroke="rgba(163,230,53,0.45)"
            strokeWidth="1.5"
          />
          <circle cx="220" cy="180" r="10" fill="#a3e635" fillOpacity="0.85">
            <animate
              attributeName="r"
              values="9;12;9"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="fill-opacity"
              values="0.7;1;0.7"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        </g>

        {/* Flowing packets */}
        <circle r="4" fill="#a3e635">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            rotate="auto"
          >
            <mpath xlinkHref="#sol-trace-left" />
          </animateMotion>
        </circle>
        <circle r="3.5" fill="#d9f99d" fillOpacity="0.9">
          <animateMotion
            dur="2.8s"
            repeatCount="indefinite"
            begin="0.9s"
            rotate="auto"
          >
            <mpath xlinkHref="#sol-trace-left" />
          </animateMotion>
        </circle>
        <circle r="4" fill="#a3e635">
          <animateMotion
            dur="2.6s"
            repeatCount="indefinite"
            begin="0.4s"
            rotate="auto"
          >
            <mpath xlinkHref="#sol-trace-right" />
          </animateMotion>
        </circle>

        {/* Motion paths (invisible; same curves as connectors) */}
        <path
          id="sol-trace-left"
          d="M 132 180 C 172 172 196 168 218 180"
          fill="none"
          stroke="none"
        />
        <path
          id="sol-trace-right"
          d="M 222 180 C 262 188 286 172 310 180"
          fill="none"
          stroke="none"
        />

        {/* Labels — centered under each panel, below bottom edge */}
        <text
          x="83"
          y="288"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.35)"
          style={{ fontSize: 11 }}
          className="font-mono tracking-wider"
        >
          PRIVATE
        </text>
        <text
          x="357"
          y="288"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.35)"
          style={{ fontSize: 11 }}
          className="font-mono tracking-wider"
        >
          PUBLIC
        </text>
        <text
          x="220"
          y="252"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(163,230,53,0.65)"
          style={{ fontSize: 12 }}
          className="font-mono tracking-wide"
        >
          Agentic Oracle
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Problem slide — fractured pipeline / broken trust visual           */
/* ------------------------------------------------------------------ */

function ProblemFractureVisual() {
  return (
    <div
      className="relative w-full max-w-[min(100%,440px)] mx-auto lg:mx-0 lg:ml-auto aspect-5/4 select-none"
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(248,113,113,0.08),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <svg
        viewBox="0 0 440 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-1 w-full h-full drop-shadow-[0_0_36px_rgba(248,113,113,0.06)]"
      >
        <defs>
          <linearGradient id="prob-doc-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="prob-warn-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.04" />
          </linearGradient>
          <filter id="prob-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Central invoice / factoring doc — hairline crack */}
        <rect
          x="148"
          y="44"
          width="144"
          height="168"
          rx="14"
          fill="url(#prob-doc-grad)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.25"
        />
        <path
          d="M 200 52 L 228 200"
          stroke="rgba(248,113,113,0.45)"
          strokeWidth="1.25"
          strokeLinecap="round"
        >
          <animate
            attributeName="stroke-opacity"
            values="0.35;0.75;0.35"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </path>
        <text
          x="220"
          y="88"
          textAnchor="middle"
          fill="rgba(255,255,255,0.25)"
          style={{ fontSize: 10 }}
          className="font-mono tracking-widest"
        >
          INVOICE
        </text>
        <rect x="168" y="102" width="104" height="6" rx="2" fill="rgba(255,255,255,0.08)" />
        <rect x="168" y="116" width="72" height="6" rx="2" fill="rgba(255,255,255,0.05)" />
        <rect x="168" y="130" width="88" height="6" rx="2" fill="rgba(255,255,255,0.05)" />
        <text
          x="220"
          y="178"
          textAnchor="middle"
          fill="#f87171"
          style={{ fontSize: 11 }}
          className="font-mono font-semibold"
        >
          FACTORED WITHOUT CONSENT
        </text>

        {/* Three pain anchors */}
        {[
          { x: 72, y: 248, label: "NO CONSENT", sub: "unilateral" },
          { x: 220, y: 268, label: "EXPOSED", sub: "on-chain" },
          { x: 368, y: 248, label: "BAD UX", sub: "wallet hell" },
        ].map((a, i) => (
          <g key={a.label}>
            <circle
              cx={a.x}
              cy={a.y}
              r="36"
              fill="url(#prob-warn-grad)"
              stroke="rgba(248,113,113,0.35)"
              strokeWidth="1.25"
            />
            <circle cx={a.x} cy={a.y} r="36" fill="none" stroke="rgba(248,113,113,0.2)" strokeWidth="1" strokeDasharray="4 6">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`0 ${a.x} ${a.y}`}
                to={`360 ${a.x} ${a.y}`}
                dur={`${14 + i * 2}s`}
                repeatCount="indefinite"
              />
            </circle>
            <text
              x={a.x}
              y={a.y - 4}
              textAnchor="middle"
              fill="#f87171"
              style={{ fontSize: 9, fontWeight: 700 }}
              className="font-mono tracking-wide"
            >
              {a.label}
            </text>
            <text
              x={a.x}
              y={a.y + 10}
              textAnchor="middle"
              fill="rgba(255,255,255,0.28)"
              style={{ fontSize: 8 }}
              className="font-mono"
            >
              {a.sub}
            </text>
          </g>
        ))}

        {/* Broken connectors doc → nodes */}
        <path
          d="M 176 200 C 130 220 100 232 92 248"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d="M 220 212 L 220 232"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d="M 264 200 C 310 220 340 232 348 248"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1.5"
        />
        <path
          d="M 176 200 C 130 220 100 232 92 248"
          stroke="#f87171"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="5 8"
          strokeOpacity="0.5"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.3s" repeatCount="indefinite" />
        </path>
        <path
          d="M 220 212 L 220 232"
          stroke="#f87171"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="5 8"
          strokeOpacity="0.5"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.1s" repeatCount="indefinite" />
        </path>
        <path
          d="M 264 200 C 310 220 340 232 348 248"
          stroke="#f87171"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="5 8"
          strokeOpacity="0.5"
        >
          <animate attributeName="stroke-dashoffset" from="0" to="26" dur="1.3s" repeatCount="indefinite" />
        </path>

        {/* Warning badge */}
        <g filter="url(#prob-glow)">
          <rect
            x="158"
            y="302"
            width="124"
            height="36"
            rx="10"
            fill="rgba(248,113,113,0.08)"
            stroke="rgba(248,113,113,0.35)"
            strokeWidth="1"
          />
          <text
            x="220"
            y="324"
            textAnchor="middle"
            fill="rgba(248,113,113,0.9)"
            style={{ fontSize: 10 }}
            className="font-mono tracking-[0.2em]"
          >
            STATUS: UNVERIFIED
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TOTAL SLIDES                                                       */
/* ------------------------------------------------------------------ */

const TOTAL_SLIDES = 14;

/* ------------------------------------------------------------------ */
/*  Market slide — concentric TAM / SAM / SOM + CAGR                     */
/* ------------------------------------------------------------------ */

function marketPolar(cx: number, cy: number, radius: number, angleDeg: number) {
  const t = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(t),
    y: cy - radius * Math.sin(t),
  };
}

function MarketConcentricVisual() {
  const cx = 200;
  const cy = 200;

  const ringCallouts = [
    {
      r: 168,
      stroke: "rgba(255,255,255,0.12)",
      fill: "rgba(163,230,53,0.04)",
      label: "$3.1T",
      sub: "Global factoring TAM",
      labelR: 192,
      labelAngle: 132,
      lineToR: 168,
    },
    {
      r: 122,
      stroke: "rgba(255,255,255,0.14)",
      fill: "rgba(163,230,53,0.07)",
      label: "~$420B",
      sub: "Digital-first AR finance",
      labelR: 50,
      labelAngle: 12,
      lineToR: 122,
    },
    {
      r: 78,
      stroke: "rgba(163,230,53,0.35)",
      fill: "rgba(163,230,53,0.12)",
      label: "~$35B",
      sub: "On-chain private credit",
      labelR: 102,
      labelAngle: -56,
      lineToR: 78,
    },
  ] as const;

  const innerRing = {
    r: 38,
    stroke: "#a3e635",
    fill: "rgba(163,230,53,0.22)",
  };

  const rings = [...ringCallouts, innerRing];

  return (
    <div
      className="relative w-full max-w-[min(100%,480px)] mx-auto aspect-square select-none"
      aria-hidden
    >
      <svg
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_48px_rgba(163,230,53,0.06)]"
      >
        <defs>
          <filter id="marketGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {rings.map((ring, i) => (
          <motion.circle
            key={ring.r}
            cx={cx}
            cy={cy}
            r={ring.r}
            fill={ring.fill}
            stroke={ring.stroke}
            strokeWidth={i === rings.length - 1 ? 2 : 1.25}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.12, duration: 0.55, ease: "easeOut" }}
            filter={i === rings.length - 1 ? "url(#marketGlow)" : undefined}
          />
        ))}

        {/* Leader lines from each band to its metric (outside the ring) */}
        {ringCallouts.map((ring, i) => {
          const edge = marketPolar(cx, cy, ring.lineToR, ring.labelAngle);
          const tip = marketPolar(cx, cy, ring.labelR - 6, ring.labelAngle);
          return (
            <motion.line
              key={`line-${ring.r}`}
              x1={edge.x}
              y1={edge.y}
              x2={tip.x}
              y2={tip.y}
              stroke="rgba(163,230,53,0.35)"
              strokeWidth={1}
              strokeDasharray="3 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.08, duration: 0.35 }}
            />
          );
        })}

        {/* One metric per ring, spaced ~120° apart on the diagram */}
        {ringCallouts.map((ring, i) => {
          const p = marketPolar(cx, cy, ring.labelR, ring.labelAngle);
          const rad = (ring.labelAngle * Math.PI) / 180;
          const c = Math.cos(rad);
          const s = Math.sin(rad);
          let anchor: "start" | "middle" | "end" = "middle";
          let dx = 0;
          if (c > 0.15 && s >= 0) {
            anchor = "start";
            dx = 14;
          } else if (c > 0.15 && s < 0) {
            anchor = "end";
            dx = -14;
          }
          return (
            <motion.g
              key={`lbl-${ring.r}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 + i * 0.1, duration: 0.45 }}
            >
              <circle
                cx={p.x}
                cy={p.y + 30}
                r={4}
                fill="#a3e635"
                fillOpacity={0.85}
              />
              <text
                x={p.x + dx}
                y={p.y - 2}
                textAnchor={anchor}
                fill="#ffffff"
                className="font-heading"
                style={{ fontSize: i === 0 ? 28 : 24 }}
              >
                {ring.label}
              </text>
              <text
                x={p.x + dx}
                y={p.y + 18}
                textAnchor={anchor}
                fill="rgba(255,255,255,0.42)"
                style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}
              >
                {ring.sub}
              </text>
            </motion.g>
          );
        })}

        <motion.text
          x={cx}
          y={200}
          textAnchor="middle"
          fill="#ffffff"
          className="font-heading"
          style={{ fontSize: 20 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          CAGR
        </motion.text>
        <motion.text
          x={cx}
          y={218}
          textAnchor="middle"
          fill="#a3e635"
          className="font-heading "
          style={{ fontSize: 30 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
        >
          11.5%
        </motion.text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Yield Flow — animated capital-cycle diagram                        */
/* ------------------------------------------------------------------ */

function YieldFlowVisual() {
  return (
    <div className="relative w-full select-none" aria-hidden>
      <svg
        viewBox="0 0 880 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-[0_0_40px_rgba(163,230,53,0.06)]"
      >
        <defs>
          <marker id="yf-a" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0 0L7 2.5L0 5Z" fill="#a3e635" />
          </marker>
          <marker id="yf-ad" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
            <path d="M0 0L7 2.5L0 5Z" fill="rgba(255,255,255,0.25)" />
          </marker>
          <filter id="yf-g">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── SUPPLIER node ── */}
        <rect x="10" y="30" width="160" height="88" rx="14"
          fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
        <text x="90" y="60" textAnchor="middle" fill="#a3e635"
          style={{ fontSize: 14, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
          Supplier
        </text>
        <text x="90" y="80" textAnchor="middle" fill="rgba(255,255,255,0.4)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Has $100k invoice
        </text>
        <text x="90" y="96" textAnchor="middle" fill="rgba(255,255,255,0.4)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Needs cash NOW
        </text>

        {/* ── FINVOICE hub ── */}
        <g filter="url(#yf-g)">
          <circle cx="440" cy="74" r="58" fill="rgba(163,230,53,0.04)"
            stroke="rgba(163,230,53,0.35)" strokeWidth="1.5" />
          <circle cx="440" cy="74" r="40" fill="rgba(163,230,53,0.08)"
            stroke="rgba(163,230,53,0.55)" strokeWidth="1" />
          <circle cx="440" cy="74" r="10" fill="#a3e635" fillOpacity="0.8">
            <animate attributeName="r" values="9;12;9" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" values="0.65;1;0.65" dur="2.4s" repeatCount="indefinite" />
          </circle>
        </g>
        <text x="440" y="68" textAnchor="middle" fill="#a3e635"
          style={{ fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
          FINVOICE
        </text>
        <text x="440" y="84" textAnchor="middle" fill="rgba(255,255,255,0.35)"
          style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
          Marketplace
        </text>

        {/* ── FUNDER node ── */}
        <rect x="710" y="30" width="160" height="88" rx="14"
          fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
        <text x="790" y="60" textAnchor="middle" fill="#a3e635"
          style={{ fontSize: 14, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
          Funder
        </text>
        <text x="790" y="80" textAnchor="middle" fill="rgba(255,255,255,0.4)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Has capital
        </text>
        <text x="790" y="96" textAnchor="middle" fill="rgba(255,255,255,0.4)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Wants yield
        </text>

        {/* ── DEBTOR node ── */}
        <rect x="355" y="290" width="170" height="76" rx="14"
          fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        <text x="440" y="318" textAnchor="middle" fill="rgba(255,255,255,0.55)"
          style={{ fontSize: 14, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
          Debtor
        </text>
        <text x="440" y="340" textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Pays $100k at maturity
        </text>

        {/* ═══ FLOW ARROWS ═══ */}

        {/* 1. Supplier → Hub: lists invoice */}
        <path d="M 170 60 L 376 66" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M 170 60 L 376 66" stroke="#a3e635" strokeWidth="1.5"
          strokeDasharray="5 8" strokeOpacity="0.55" markerEnd="url(#yf-a)">
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.2s" repeatCount="indefinite" />
        </path>
        <text x="265" y="50" textAnchor="middle" fill="rgba(255,255,255,0.28)"
          style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
          lists invoice
        </text>

        {/* 2. Funder → Hub: buys at discount */}
        <path d="M 710 60 L 504 66" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
        <path d="M 710 60 L 504 66" stroke="#a3e635" strokeWidth="1.5"
          strokeDasharray="5 8" strokeOpacity="0.55" markerEnd="url(#yf-a)">
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.2s" repeatCount="indefinite" />
        </path>
        <text x="615" y="50" textAnchor="middle" fill="rgba(255,255,255,0.28)"
          style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
          buys at discount
        </text>

        {/* 3. Hub → Supplier: early cash (curved below) */}
        <path d="M 382 105 C 310 195 210 185 90 128" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <path d="M 382 105 C 310 195 210 185 90 128" stroke="#a3e635" strokeWidth="2"
          strokeDasharray="5 8" strokeOpacity="0.65" markerEnd="url(#yf-a)">
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.4s" repeatCount="indefinite" />
        </path>
        <rect x="155" y="172" width="120" height="28" rx="6"
          fill="rgba(163,230,53,0.1)" stroke="rgba(163,230,53,0.25)" strokeWidth="1" />
        <text x="215" y="191" textAnchor="middle" fill="#a3e635"
          style={{ fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
          $97.9k NOW
        </text>

        {/* 4. Hub → Funder: return + yield (curved below) */}
        <path d="M 498 105 C 570 195 670 185 790 128" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" />
        <path d="M 498 105 C 570 195 670 185 790 128" stroke="#a3e635" strokeWidth="2"
          strokeDasharray="5 8" strokeOpacity="0.65" markerEnd="url(#yf-a)">
          <animate attributeName="stroke-dashoffset" from="0" to="26" dur="1.4s" repeatCount="indefinite" />
        </path>
        <rect x="585" y="172" width="130" height="28" rx="6"
          fill="rgba(163,230,53,0.1)" stroke="rgba(163,230,53,0.25)" strokeWidth="1" />
        <text x="650" y="191" textAnchor="middle" fill="#a3e635"
          style={{ fontSize: 11, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
          $100k + YIELD
        </text>

        {/* 5. Debtor → Hub: pays at maturity */}
        <path d="M 440 290 L 440 138" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
        <path d="M 440 290 L 440 138" stroke="rgba(255,255,255,0.28)" strokeWidth="1.5"
          strokeDasharray="5 8" markerEnd="url(#yf-ad)">
          <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="1.6s" repeatCount="indefinite" />
        </path>
        <text x="480" y="220" fill="rgba(255,255,255,0.22)"
          style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
          $100k at maturity
        </text>

        {/* ── Flowing particles ── */}
        <circle r="3.5" fill="#a3e635">
          <animateMotion dur="2.4s" repeatCount="indefinite"
            path="M 170 60 L 376 66" />
        </circle>
        <circle r="3.5" fill="#a3e635">
          <animateMotion dur="2.4s" repeatCount="indefinite"
            path="M 710 60 L 504 66" />
        </circle>
        <circle r="4" fill="#a3e635" fillOpacity="0.85">
          <animateMotion dur="3s" repeatCount="indefinite"
            path="M 382 105 C 310 195 210 185 90 128" />
        </circle>
        <circle r="4" fill="#a3e635" fillOpacity="0.85">
          <animateMotion dur="3s" repeatCount="indefinite" begin="0.5s"
            path="M 498 105 C 570 195 670 185 790 128" />
        </circle>
        <circle r="3" fill="rgba(255,255,255,0.45)">
          <animateMotion dur="2.8s" repeatCount="indefinite"
            path="M 440 290 L 440 138" />
        </circle>

        {/* ── YIELD SOURCE callout ── */}
        <rect x="15" y="250" width="270" height="135" rx="14"
          fill="rgba(163,230,53,0.04)" stroke="rgba(163,230,53,0.18)" strokeWidth="1" />
        <text x="35" y="278" fill="rgba(163,230,53,0.55)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace", letterSpacing: 2 }}>
          YIELD SOURCE
        </text>
        <text x="35" y="306" fill="#ffffff"
          style={{ fontSize: 14, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
          $100k − $97.9k = $2,100
        </text>
        <text x="35" y="330" fill="rgba(255,255,255,0.35)"
          style={{ fontSize: 10, fontFamily: "ui-monospace, monospace" }}>
          Annualized over 30-day maturity
        </text>
        <text x="35" y="366" fill="#a3e635"
          style={{ fontSize: 24, fontWeight: 800, fontFamily: "ui-monospace, monospace" }}>
          = 26.1% APY
        </text>

        {/* ── Platform fee note ── */}
        <rect x="610" y="250" width="260" height="52" rx="10"
          fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <text x="740" y="272" textAnchor="middle" fill="rgba(255,255,255,0.3)"
          style={{ fontSize: 9, fontFamily: "ui-monospace, monospace" }}>
          PLATFORM FEE
        </text>
        <text x="740" y="290" textAnchor="middle" fill="rgba(255,255,255,0.5)"
          style={{ fontSize: 13, fontWeight: 600, fontFamily: "ui-monospace, monospace" }}>
          0.3% at settlement
        </text>
      </svg>
    </div>
  );
}

/* ================================================================== */
/*  PAGE COMPONENT                                                     */
/* ================================================================== */

export default function PitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const isScrolling = useRef(false);

  /* ---------- Intersection Observer ---------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const slides = container.querySelectorAll("[data-slide]");
    slideRefs.current = Array.from(slides) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrolling.current) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(
              (entry.target as HTMLElement).dataset.slide
            );
            setCurrentSlide(idx);
          }
        });
      },
      { root: container, threshold: 0.55 }
    );

    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  /* ---------- Programmatic scroll ---------- */
  const goTo = useCallback((idx: number) => {
    const target = slideRefs.current[idx];
    if (!target) return;
    isScrolling.current = true;
    setCurrentSlide(idx);
    target.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      isScrolling.current = false;
    }, 900);
  }, []);

  const next = useCallback(
    () => goTo(Math.min(currentSlide + 1, TOTAL_SLIDES - 1)),
    [currentSlide, goTo]
  );
  const prev = useCallback(
    () => goTo(Math.max(currentSlide - 1, 0)),
    [currentSlide, goTo]
  );

  /* ---------- Keyboard nav ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="relative bg-[#0a0a0a] text-white">
      {/* ---- Snap-scroll container ---- */}
      <div
        ref={containerRef}
        className="h-screen overflow-y-auto snap-y snap-mandatory"
      >
        {/* ======================================================= */}
        {/*  SLIDE 0 - Title                                         */}
        {/* ======================================================= */}
        <Slide index={0}>
          <div className="flex flex-col items-center text-center relative">
            {/* Logo-masked video – same visual as landing hero */}
            <HeroLogoMaskVideo
              className="absolute left-1/2 -top-48 z-0 h-[min(48rem,50vw)] w-[min(48rem,50vw)] -translate-x-1/2 mask-[url(/logo-mask.svg)] [-webkit-mask-image:url(/logo-mask.svg)] mask-center mask-no-repeat mask-contain opacity-70"
              videoClassName="opacity-60 filter hue-rotate-270"
            />

            {/* Spacer to push text below the masked video */}
            <div className="relative w-full min-h-[min(12rem,30vw)]" aria-hidden />

            <motion.h1
              variants={scaleIn}
              className="relative z-10 text-7xl md:text-9xl font-heading text-white leading-none"
            >
              <span className="text-lime-400">finvoice</span>.fi
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={1}
              className="relative z-10 text-xl md:text-2xl text-white/50 max-w-xl"
            >
              One click turns invoices into yield
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="relative z-10 flex mt-3 flex-wrap gap-3 justify-center"
            >
              <Pill>RWA Tokenization</Pill>
              <Pill>Flare Privacy</Pill>
              <Pill>AI Scoring</Pill>
            </motion.div>

            <motion.p
              variants={fadeUp}
              custom={3}
              className="relative z-10 text-5xl mt-10 font-heading tracking-normal text-lime-400"
            >
              a whoppin&apos; $3.1T market
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="absolute bottom-12 animate-bounce text-white/30 z-10"
            >
              <ChevronDown size={28} />
            </motion.div>
          </div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 1 - Team + Close                                  */}
        {/* ======================================================= */}
        <Slide index={1}>
          <SectionLabel text="01 — The Team" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-10"
          >
            Built to ship
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="grid grid-cols-2 gap-5 mb-12 max-w-lg mx-auto"
          >
            {[
              { name: "Sairam", role: "Full Stack Developer", src: "/sairam.gif" },
              { name: "Philo Sanjay", role: "Backend Developer", src: "/philo.gif" },
            ].map((m) => (
              <div
                key={m.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col"
              >
                <div className="relative w-full h-48 sm:h-52 md:h-56 bg-black/30">
                  <Image
                    src={m.src}
                    alt={m.name}
                    fill
                    unoptimized={
                      m.src.endsWith(".gif") || m.src.endsWith(".GIF")
                    }
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <div className="p-5 flex flex-col items-center text-center">
                  <p className="text-white text-sm font-medium">{m.name}</p>
                  <p className="text-gray-400 text-xs">{m.role}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={3}
            className="text-4xl md:text-5xl font-heading text-white text-center mb-8"
          >
            Three trillion dollar market.
            <br />
            <span className="text-lime-400">One click.</span>
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={4}
            className="flex justify-center gap-4"
          >
            <a
              href="/create-invoice"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-lime-400 text-[#0a0a0a] text-sm font-semibold hover:bg-lime-300 transition-colors"
            >
              Try the Demo <ArrowRight size={16} />
            </a>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 hover:text-white/80 transition-colors"
            >
              Browse Market <ArrowRight size={16} />
            </a>
          </motion.div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 2 - Problem                                       */}
        {/* ======================================================= */}
        <Slide index={2}>
          <div className="grid lg:grid-cols-[1fr_min(40%,440px)] gap-10 lg:gap-14 items-center w-full">
            <div className="min-w-0 order-2 lg:order-1">
              <SectionLabel text="02 — The Problem" />
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-6xl font-heading text-white mb-3 md:mb-4"
              >
                Invoice factoring is{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-red-400 to-red-500/90">
                  broken
                </span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg text-white/45 max-w-2xl mb-8 md:mb-10"
              >
                Legacy rails optimize for speed of capital, not legitimacy of claims
                &mdash; so consent, privacy, and UX all lose.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="grid sm:grid-cols-3 gap-4 md:gap-5 mb-8 md:mb-10"
              >
                {[
                  {
                    num: "01",
                    icon: <ShieldOff className="text-red-400" size={22} strokeWidth={1.75} />,
                    title: "No debtor consent",
                    desc: "Unilateral tokenization with zero verification",
                  },
                  {
                    num: "02",
                    icon: <Frown className="text-red-400" size={22} strokeWidth={1.75} />,
                    title: "Privacy violation",
                    desc: "Business relationships exposed publicly",
                  },
                  {
                    num: "03",
                    icon: <FileText className="text-red-400" size={22} strokeWidth={1.75} />,
                    title: "Terrible UX",
                    desc: "MetaMask, dApps, complex flows nobody uses",
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="group relative rounded-2xl border border-red-500/15 bg-gradient-to-b from-red-500/[0.07] via-white/[0.02] to-transparent p-5 md:p-6 flex flex-col gap-3 shadow-[0_0_0_1px_rgba(248,113,113,0.06)_inset] transition-colors hover:border-red-400/25"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono tracking-widest text-red-400/80">
                        {card.num}
                      </span>
                      <div className="rounded-xl bg-red-500/10 p-2.5 ring-1 ring-red-500/20 group-hover:bg-red-500/[0.14] transition-colors">
                        {card.icon}
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-white leading-snug">
                      {card.title}
                    </h3>
                    <p className="text-white/45 text-sm leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 md:px-8 md:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-white/35">
                  Market reality
                </p>
                <p className="text-xl md:text-2xl font-heading text-white/90">
                  <span className="text-lime-400">$3.1T</span>
                  <span className="text-white/50 font-normal text-base md:text-lg ml-2">
                    still on faxed PDFs &amp; blind trust
                  </span>
                </p>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="order-1 lg:order-2 flex justify-center lg:justify-end pb-4 lg:pb-0 w-full"
            >
              <ProblemFractureVisual />
            </motion.div>
          </div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 3 - Solution                                      */}
        {/* ======================================================= */}
        <Slide index={3}>
          <div className="grid lg:grid-cols-[1fr_min(38%,420px)] gap-10 lg:gap-14 items-center w-full">
            <div className="min-w-0">
              <SectionLabel text="03 — The Solution" />
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-6xl font-heading text-white mb-4"
              >
                Finvoice.Finance
              </motion.h2>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-white/70 max-w-3xl mb-10 lg:mb-12"
              >
                Unlocking a new economy where private assets meet public liquidity,
                powered by AI agents on Flare.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="space-y-6 max-w-3xl mb-8 lg:mb-10"
              >
                <p className="text-white/60 text-base leading-relaxed">
                  Invoices live on a Flare TEE &mdash; debtor identities,
                  payment history, and commercial terms never leave. An AI agent
                  scores credit risk and bridges only what matters (risk grade,
                  yield, confidence) to a public marketplace where anyone can fund
                  invoices and earn yield.
                </p>

                <p className="text-white/60 text-base leading-relaxed">
                  <span className="text-white font-semibold">
                    The primitive: PDF onramp.
                  </span>{" "}
                  Debtors just approve invoices through a regular PDF &mdash;
                  OTP-verified, no wallet, no dApp. That one click tokenizes the
                  invoice on-chain and kicks off the entire pipeline. TradFi UX,
                  DeFi rails.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={4}
                className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.03] p-8"
              >
                <p className="text-white text-base font-medium">
                  Private data stays private. Public markets stay liquid. AI agents
                  connect the two.
                </p>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              custom={2}
              className="flex justify-center lg:justify-end pb-2 lg:pb-0"
            >
              <SolutionAbstractVisual />
            </motion.div>
          </div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 4 - User Flow (Animated SVG Diagram)              */}
        {/* ======================================================= */}
        <Slide index={4}>
          <SectionLabel text="04 — User Flow" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-8"
          >
            How it works, end to end
          </motion.h2>

          <motion.div variants={fadeUp} custom={2} className="w-full overflow-x-auto">
            <svg
              viewBox="0 0 1100 420"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto min-w-[700px]"
            >
              <defs>
                <marker id="arrowLime" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <path d="M0 0L8 3L0 6Z" fill="#a3e635" />
                </marker>
                <marker id="arrowDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <path d="M0 0L8 3L0 6Z" fill="rgba(255,255,255,0.25)" />
                </marker>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="particleGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                {/* Full flow path for the traveling particle */}
                <path
                  id="flowPath"
                  d="M100,66 L275,66 L370,66 L460,66 L555,66 L650,66 L650,102 L650,186 L540,186 L450,186 L340,186 L340,222 L340,306 L450,306 L545,306 L640,306 L730,306 L825,306 L940,306"
                  fill="none"
                />
                <style>{`
                  /* ── Box draw-in: stroke draws then fill fades ── */
                  @keyframes drawBox {
                    0%   { stroke-dashoffset: 500; fill-opacity: 0; }
                    60%  { stroke-dashoffset: 0;   fill-opacity: 0; }
                    100% { stroke-dashoffset: 0;   fill-opacity: 1; }
                  }
                  @keyframes drawBoxGlow {
                    0%   { stroke-dashoffset: 600; fill-opacity: 0; }
                    60%  { stroke-dashoffset: 0;   fill-opacity: 0; }
                    100% { stroke-dashoffset: 0;   fill-opacity: 1; }
                  }
                  /* ── Text fade-in ── */
                  @keyframes textReveal {
                    0%   { opacity: 0; }
                    100% { opacity: 1; }
                  }
                  /* ── Privacy boundary draw ── */
                  @keyframes drawBoundary {
                    0%   { stroke-dashoffset: 1800; opacity: 0; }
                    10%  { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 1; }
                  }
                  /* ── Settlement pulse ── */
                  @keyframes settlePulse {
                    0%, 100% { filter: url(#glow); }
                    50%      { filter: url(#glow) brightness(1.3); }
                  }

                  /* ── Sequenced boxes ── */
                  .box-1 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 0.1s ease-out both; }
                  .box-1 .label { animation: textReveal 0.4s 0.5s ease-out both; }
                  .box-2 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 0.5s ease-out both; }
                  .box-2 .label { animation: textReveal 0.4s 0.9s ease-out both; }
                  .box-3 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 0.9s ease-out both; }
                  .box-3 .label { animation: textReveal 0.4s 1.3s ease-out both; }
                  .box-4 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 1.4s ease-out both; }
                  .box-4 .label { animation: textReveal 0.4s 1.8s ease-out both; }
                  .box-5 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 1.9s ease-out both; }
                  .box-5 .label { animation: textReveal 0.4s 2.3s ease-out both; }
                  .box-6 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 2.4s ease-out both; }
                  .box-6 .label { animation: textReveal 0.4s 2.8s ease-out both; }
                  .box-7 .draw { stroke-dasharray: 500; animation: drawBox 0.7s 2.8s ease-out both; }
                  .box-7 .label { animation: textReveal 0.4s 3.2s ease-out both; }
                  .box-8 .draw { stroke-dasharray: 600; animation: drawBoxGlow 0.8s 3.2s ease-out both; }
                  .box-8 .label { animation: textReveal 0.4s 3.6s ease-out both; }
                  .box-8 .draw-done { animation: settlePulse 2s 4s ease-in-out infinite; }

                  /* ── Privacy boundary ── */
                  .privacy-boundary { stroke-dasharray: 8 6; animation: drawBoundary 1.8s 1.2s ease-out both; }

                  /* ── Legend fade ── */
                  .legend { animation: textReveal 0.6s 3.8s ease-out both; }

                  /* ── Traveling particle along the full flow path ── */
                  .particle { animation: textReveal 0.3s 3.6s ease-out both; }
                  .particle circle { animation: particleMove 6s 3.8s linear infinite; }
                  @keyframes particleMove { 0% { opacity: 1; } 100% { opacity: 1; } }
                `}</style>
              </defs>

              {/* ── Privacy boundary zone ── */}
              <rect
                x="200" y="115" width="700" height="195" rx="16"
                stroke="rgba(255,255,255,0.08)" strokeWidth="1.5"
                fill="rgba(255,255,255,0.015)"
                className="privacy-boundary"
              />
              <text x="216" y="136" fill="rgba(255,255,255,0.18)" fontSize="10" fontFamily="monospace"
                style={{ animation: "textReveal 0.4s 2s ease-out both" }}>
                PRIVATE LAYER (Flare TEE)
              </text>

              {/* ── Traveling particle (behind boxes) ── */}
              <g className="particle" filter="url(#particleGlow)">
                <circle r="4" fill="#a3e635">
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    begin="3.8s"
                    path="M100,66 L275,66 L370,66 L555,66 L650,66 L650,120 L650,186 L540,186 L340,186 L340,240 L340,306 L545,306 L640,306 L825,306 L940,306"
                  />
                </circle>
                <circle r="4" fill="#a3e635" opacity="0.4">
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    begin="4.5s"
                    path="M100,66 L275,66 L370,66 L555,66 L650,66 L650,120 L650,186 L540,186 L340,186 L340,240 L340,306 L545,306 L640,306 L825,306 L940,306"
                  />
                </circle>
              </g>

              {/* ═══ ROW 1 ═══ */}

              {/* Box 1: Supplier */}
              <g className="box-1">
                <rect x="20" y="30" width="160" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="20" y="30" width="160" height="72" rx="12"
                  fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
                <text className="label" x="100" y="58" textAnchor="middle" fill="#a3e635"
                  fontSize="13" fontWeight="600" fontFamily="monospace">Supplier</text>
                <text className="label" x="100" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)"
                  fontSize="10" fontFamily="monospace">Creates invoice</text>
              </g>

              {/* Arrow 1: Supplier → PDF */}
              <line x1="180" y1="66" x2="268" y2="66" stroke="#a3e635" strokeWidth="1.5"
                markerEnd="url(#arrowLime)" />

              {/* Box 2: PDF Generated */}
              <g className="box-2">
                <rect x="280" y="30" width="180" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="280" y="30" width="180" height="72" rx="12"
                  fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text className="label" x="370" y="58" textAnchor="middle" fill="rgba(255,255,255,0.7)"
                  fontSize="13" fontWeight="600" fontFamily="monospace">PDF Generated</text>
                <text className="label" x="370" y="78" textAnchor="middle" fill="rgba(255,255,255,0.35)"
                  fontSize="10" fontFamily="monospace">Embed approval link</text>
              </g>

              {/* Arrow 2: PDF → Debtor */}
              <line x1="460" y1="66" x2="548" y2="66" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"
                markerEnd="url(#arrowDim)" />

              {/* Box 3: Debtor */}
              <g className="box-3">
                <rect x="560" y="30" width="180" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="560" y="30" width="180" height="72" rx="12"
                  fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
                <text className="label" x="650" y="58" textAnchor="middle" fill="#a3e635"
                  fontSize="13" fontWeight="600" fontFamily="monospace">Debtor</text>
                <text className="label" x="650" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)"
                  fontSize="10" fontFamily="monospace">Clicks Approve in PDF</text>
              </g>

              {/* Arrow 3: Debtor ↓ AI */}
              <line x1="650" y1="102" x2="650" y2="145" stroke="#a3e635" strokeWidth="1.5"
                markerEnd="url(#arrowLime)" />

              {/* ═══ ROW 2 ═══ */}

              {/* Box 4: AI Risk Scoring */}
              <g className="box-4">
                <rect x="540" y="150" width="220" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="540" y="150" width="220" height="72" rx="12"
                  fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle className="label" cx="574" cy="178" r="12"
                  fill="rgba(163,230,53,0.1)" stroke="rgba(163,230,53,0.3)" strokeWidth="1" />
                <text className="label" x="574" y="183" textAnchor="middle" fill="#a3e635" fontSize="12">◉</text>
                <text className="label" x="664" y="178" textAnchor="middle" fill="rgba(255,255,255,0.7)"
                  fontSize="13" fontWeight="600" fontFamily="monospace">AI Risk Scoring</text>
                <text className="label" x="664" y="198" textAnchor="middle" fill="rgba(255,255,255,0.35)"
                  fontSize="10" fontFamily="monospace">Grade A–D inside Flare TEE</text>
              </g>

              {/* Arrow 4: AI ← Tokenize (leftward) */}
              <line x1="540" y1="186" x2="452" y2="186" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"
                markerEnd="url(#arrowDim)" />

              {/* Box 5: Tokenize Invoice */}
              <g className="box-5">
                <rect x="230" y="150" width="220" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="230" y="150" width="220" height="72" rx="12"
                  fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
                <text className="label" x="340" y="178" textAnchor="middle" fill="#a3e635"
                  fontSize="13" fontWeight="600" fontFamily="monospace">Tokenize Invoice</text>
                <text className="label" x="340" y="198" textAnchor="middle" fill="rgba(255,255,255,0.45)"
                  fontSize="10" fontFamily="monospace">Hedera NFT + HCS event</text>
              </g>

              {/* Arrow 5: Tokenize ↓ Marketplace */}
              <line x1="340" y1="222" x2="340" y2="265" stroke="#a3e635" strokeWidth="1.5"
                markerEnd="url(#arrowLime)" />

              {/* ═══ ROW 3 ═══ */}

              {/* Box 6: Public Marketplace */}
              <g className="box-6">
                <rect x="230" y="270" width="220" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="230" y="270" width="220" height="72" rx="12"
                  fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text className="label" x="340" y="298" textAnchor="middle" fill="rgba(255,255,255,0.7)"
                  fontSize="13" fontWeight="600" fontFamily="monospace">Public Marketplace</text>
                <text className="label" x="340" y="318" textAnchor="middle" fill="rgba(255,255,255,0.35)"
                  fontSize="10" fontFamily="monospace">Grade + APY + Maturity shown</text>
              </g>

              {/* Arrow 6: Marketplace → Funder */}
              <line x1="450" y1="306" x2="538" y2="306" stroke="#a3e635" strokeWidth="1.5"
                markerEnd="url(#arrowLime)" />

              {/* Box 7: Funder */}
              <g className="box-7">
                <rect x="550" y="270" width="180" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw" x="550" y="270" width="180" height="72" rx="12"
                  fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1.5" />
                <text className="label" x="640" y="298" textAnchor="middle" fill="#a3e635"
                  fontSize="13" fontWeight="600" fontFamily="monospace">Funder</text>
                <text className="label" x="640" y="318" textAnchor="middle" fill="rgba(255,255,255,0.45)"
                  fontSize="10" fontFamily="monospace">Purchases token</text>
              </g>

              {/* Arrow 7: Funder → Settlement */}
              <line x1="730" y1="306" x2="818" y2="306" stroke="#a3e635" strokeWidth="1.5"
                markerEnd="url(#arrowLime)" />

              {/* Box 8: Instant Settlement (glowing) */}
              <g className="box-8">
                <rect x="830" y="270" width="220" height="72" rx="12" fill="#0a0a0a" />
                <rect className="draw draw-done" x="830" y="270" width="220" height="72" rx="12"
                  fill="rgba(163,230,53,0.12)" stroke="#a3e635" strokeWidth="2" filter="url(#glow)" />
                <text className="label" x="940" y="298" textAnchor="middle" fill="#a3e635"
                  fontSize="13" fontWeight="700" fontFamily="monospace">Instant Settlement</text>
                <text className="label" x="940" y="318" textAnchor="middle" fill="rgba(255,255,255,0.5)"
                  fontSize="10" fontFamily="monospace">Supplier paid, yield locked</text>
              </g>

              {/* ── Legend ── */}
              <g className="legend">
                <rect x="20" y="382" width="30" height="16" rx="4" fill="rgba(163,230,53,0.06)" stroke="#a3e635" strokeWidth="1" />
                <text x="58" y="394" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace">User action</text>
                <rect x="170" y="382" width="30" height="16" rx="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x="208" y="394" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace">Automated</text>
                <rect x="330" y="382" width="30" height="16" rx="4" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 3" />
                <text x="368" y="394" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace">Private layer</text>
                {/* Particle legend */}
                <circle cx="505" cy="390" r="4" fill="#a3e635" filter="url(#particleGlow)" />
                <text x="516" y="394" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="monospace">Data flow</text>
              </g>
            </svg>
          </motion.div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 5 - Architecture                                  */}
        {/* ======================================================= */}
        <Slide index={5}>
          <SectionLabel text="05 — Architecture" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-10"
          >
            Privacy meets transparency
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Flare TEE — Private Ledger */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center gap-3 mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <circle cx="12" cy="12" r="11" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                  <path d="M7 8h10M7 12h7M7 16h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h3 className="text-lg font-semibold text-white">Flare TEE</h3>
              </div>
              <p className="text-xs font-mono text-white/30 uppercase tracking-widest mb-6 ml-9">Private Ledger</p>
              <ul className="space-y-3">
                {[
                  "Debtor identity",
                  "Payment history",
                  "Full AI reasoning",
                  "Jurisdiction",
                  "Invoice terms",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-white/50 text-sm font-mono flex items-center gap-2"
                  >
                    <Lock size={12} className="text-white/30 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Hedera HTS + HCS — Public Ledger */}
            <div className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.03] p-8">
              <div className="flex items-center gap-3 mb-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <rect x="2" y="2" width="20" height="20" rx="4" stroke="#a3e635" strokeWidth="1"/>
                  <path d="M8 7v10M16 7v10M8 12h8" stroke="#a3e635" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <h3 className="text-lg font-semibold text-white">Hedera HTS + HCS</h3>
              </div>
              <p className="text-xs font-mono text-lime-400/50 uppercase tracking-widest mb-6 ml-9">Public Ledger</p>
              <ul className="space-y-3">
                {[
                  "Risk grade (A-D)",
                  "Yield APY",
                  "Face value",
                  "Maturity",
                  "PDF hash",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-white/50 text-sm font-mono flex items-center gap-2"
                  >
                    <Globe size={12} className="text-lime-400/60 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={3}
            className="text-white/40 font-mono text-sm text-center"
          >
            AI sees everything. Public sees only pricing signals.
          </motion.p>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 6 - Market (concentric TAM)                       */}
        {/* ======================================================= */}
        <Slide index={6}>
          <div className="grid lg:grid-cols-[1fr_min(42%,460px)] gap-10 lg:gap-14 items-center w-full">
            <div className="min-w-0">
              <SectionLabel text="06 — Market" />
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-6xl font-heading text-white mb-6"
              >
                Expanding Opportunities
              </motion.h2>
              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg text-white/55 max-w-xl mb-8"
              >
                Trade finance and invoice markets stack from broad TAM into
                digitized receivables and on-chain credit &mdash; the layers we
                sit on are compounding fast.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={3}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4"
              >
                <p className="text-xs font-mono text-white/40 uppercase tracking-widest">
                  Takeaway
                </p>
                <p className="text-white/70 text-sm leading-relaxed">
                  Large liquid TAM, double-digit CAGR, and a wedge where privacy
                  plus programmability wins &mdash; not another generic lending
                  pool.
                </p>
              </motion.div>
            </div>
            <motion.div variants={fadeUp} custom={2} className="w-full">
              <MarketConcentricVisual />
              <p className="text-center text-[10px] font-mono text-white/30 mt-4 max-w-sm mx-auto">
                Illustrative market layers; CAGR rounded from industry forecasts
              </p>
            </motion.div>
          </div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 7 - Yield Flow (capital cycle)                    */}
        {/* ======================================================= */}
        <Slide index={7}>
          <SectionLabel text="07 — Where Yield Comes From" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-4"
          >
            The discount <span className="text-lime-400">is</span> the yield
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-lg text-white/55 max-w-3xl mb-8"
          >
            Suppliers sell invoices at a discount to get cash immediately.
            Funders earn the spread when debtors pay face value at maturity.
            No speculation &mdash; yield is backed by real commercial obligations.
          </motion.p>

          <motion.div variants={fadeUp} custom={3}>
            <YieldFlowVisual />
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={4}
            className="text-white/35 text-xs font-mono text-center mt-4"
          >
            Real invoices &rarr; real payments &rarr; real yield. No token emissions, no ponzinomics.
          </motion.p>
        </Slide>
        {/* ======================================================= */}
        {/*  SLIDE 8 - Demo                                          */}
        {/* ======================================================= */}
        <Slide index={8}>
          <SectionLabel text="08 — Live Demo" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-10"
          >
            See it happen
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="grid md:grid-cols-4 gap-5 mb-8"
          >
            {[
              "Create invoice \u2192 PDF generated",
              "Debtor clicks Approve \u2192 tokenized in <1s",
              "AI scores \u2192 attestation crosses chains",
              "Funder buys \u2192 supplier paid instantly",
            ].map((text, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 flex flex-col gap-3"
              >
                <span className="text-xs font-mono text-lime-400">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <p className="text-white/60 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </motion.div>

          {/* What it proves */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="rounded-2xl border border-lime-400/20 bg-lime-400/[0.03] p-8 flex flex-col md:flex-row md:items-center gap-6"
          >
            <p className="text-xs font-mono text-lime-400 shrink-0">
              What it proves
            </p>
            <div className="flex flex-wrap gap-4">
              {[
                "Debtor consent",
                "Privacy preservation",
                "Sub-second finality",
                "Real yield",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-white/60 text-sm"
                >
                  <Check size={14} className="text-lime-400" />
                  {item}
                </span>
              ))}
            </div>
            <span className="ml-auto flex items-center gap-2 text-xs font-mono text-lime-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400" />
              </span>
              LIVE
            </span>
          </motion.div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 9 - Competitive                                  */}
        {/* ======================================================= */}
        <Slide index={9}>
          <SectionLabel text="09 — Why Finvoice" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-10"
          >
            What others can&rsquo;t do
          </motion.h2>

          <motion.div
            variants={fadeUp}
            custom={2}
            className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
          >
            {/* Header */}
            <div className="grid grid-cols-4 text-xs font-mono text-white/40 border-b border-white/10 px-8 py-4">
              <span>Feature</span>
              <span className="text-center text-lime-400">Finvoice</span>
              <span className="text-center">Traditional</span>
              <span className="text-center">Other DeFi</span>
            </div>

            {/* Rows */}
            {[
              { feature: "Debtor consent", finvoice: true, trad: false, defi: false },
              { feature: "Privacy", finvoice: true, trad: true, defi: false },
              { feature: "Agentic oracle", finvoice: true, trad: false, defi: false },
              { feature: "Sub-second", finvoice: true, trad: false, defi: true },
              { feature: "No wallet needed", finvoice: true, trad: true, defi: false },
            ].map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 px-8 py-4 text-sm border-b border-white/5 ${idx === 0
                  ? "bg-lime-400/[0.03] border-l-2 border-l-lime-400"
                  : ""
                  }`}
              >
                <span className="text-white/60">{row.feature}</span>
                <span className="flex justify-center">
                  {row.finvoice ? (
                    <Check size={16} className="text-lime-400" />
                  ) : (
                    <X size={16} className="text-red-400" />
                  )}
                </span>
                <span className="flex justify-center">
                  {row.trad ? (
                    <Check size={16} className="text-white/30" />
                  ) : (
                    <X size={16} className="text-red-400/60" />
                  )}
                </span>
                <span className="flex justify-center">
                  {row.defi ? (
                    <Check size={16} className="text-white/30" />
                  ) : (
                    <X size={16} className="text-red-400/60" />
                  )}
                </span>
              </div>
            ))}
          </motion.div>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 10 - Roadmap (trust & infra)                    */}
        {/* ======================================================= */}
        <Slide index={10}>
          <SectionLabel text="10 — Roadmap" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-4"
          >
            Hardening the trust stack
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-white/50 text-base max-w-3xl mb-10"
          >
            Today we ship privacy-preserving scoring and attestations on Flare.
            Next phases add cryptographic and economic security so grades and
            settlement stay solid at institutional scale.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="grid sm:grid-cols-2 gap-5"
          >
            {[
              {
                icon: <Binary className="text-lime-400" size={22} />,
                phase: "Phase 1",
                title: "ZK attestations",
                desc: "Prove risk grade and invoice integrity without exposing debtor PII or model features on L1.",
              },
              {
                icon: <EyeOff className="text-lime-400" size={22} />,
                phase: "Phase 2",
                title: "Blind compute",
                desc: "Run scoring pipelines on encrypted or committed data so even operators cannot read raw inputs.",
              },
              {
                icon: <Cpu className="text-lime-400" size={22} />,
                phase: "Phase 3",
                title: "Flare TEE multi-signer",
                desc: "Multiple TEE machines co-sign attestations for fault tolerance and decentralized trust.",
              },
              {
                icon: <Layers className="text-lime-400" size={22} />,
                phase: "Phase 4",
                title: "Cross-chain settlement",
                desc: "Settle invoices across Flare, Hedera, and XRPL via FDC attestations and Smart Accounts.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {item.phase}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={4}
            className="mt-8 text-center text-white/35 text-xs font-mono"
          >
            One stack: privacy now, verifiable compute next, economic security last
          </motion.p>
        </Slide>

        {/* ======================================================= */}
        {/*  SLIDE 11 - Go-To-Market Strategy                       */}
        {/* ======================================================= */}
        <Slide index={11}>
          <SectionLabel text="11 — Go-To-Market" />
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-5xl md:text-6xl font-heading text-white mb-4"
          >
            Land, expand, dominate
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-white/50 text-base max-w-3xl mb-10"
          >
            A three-phase GTM motion: anchor with pilot banks on Flare, expand
            through ecosystem network effects, then capture the broader
            institutional credit market.
          </motion.p>

          <motion.div
            variants={fadeUp}
            custom={3}
            className="grid sm:grid-cols-2 gap-5"
          >
            {[
              {
                icon: <Target className="text-lime-400" size={22} />,
                phase: "Phase 1 — Land",
                title: "Pilot with anchor banks",
                desc: "Onboard 2–3 Flare member banks with a white-glove integration. Prove scoring accuracy and settlement speed on live receivables portfolios.",
              },
              {
                icon: <Users className="text-lime-400" size={22} />,
                phase: "Phase 2 — Expand",
                title: "Ecosystem network effects",
                desc: "Each bank brings its supplier network onto the platform. More invoices improve the model; better grades attract more liquidity providers.",
              },
              {
                icon: <Megaphone className="text-lime-400" size={22} />,
                phase: "Phase 3 — Channel",
                title: "ERP & fintech integrations",
                desc: "Embed Finvoice scoring as an API inside ERP systems and trade-finance platforms so originators can grade invoices at the point of creation.",
              },
              {
                icon: <TrendingUp className="text-lime-400" size={22} />,
                phase: "Phase 4 — Scale",
                title: "Cross-chain & multi-asset",
                desc: "Extend beyond receivables to supply-chain finance, payables, and cross-border trade — becoming the institutional credit layer for RWAs.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                    {item.phase}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </motion.div>

          <motion.p
            variants={fadeUp}
            custom={4}
            className="mt-8 text-center text-white/35 text-xs font-mono"
          >
            Pilot → network effects → platform moat → institutional standard
          </motion.p>
        </Slide>
      </div>

      {/* ============================================================ */}
      {/*  FIXED OVERLAY: Home + dot nav + arrows + counter + hint     */}
      {/* ============================================================ */}

      <Link
        href="/"
        className="fixed left-6 top-6 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-[#0a0a0a]/80 px-3 py-2 text-xs font-mono text-white/50 backdrop-blur-sm transition-colors hover:border-white/20 hover:text-white/80"
        aria-label="Back to home"
      >
        <Home size={16} />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {/* Dot navigation - right edge */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2.5">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === i
              ? "bg-lime-400 scale-125"
              : "bg-white/20 hover:bg-white/40"
              }`}
          />
        ))}
      </div>

      {/* Arrow buttons - bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
        <button
          onClick={prev}
          disabled={currentSlide === 0}
          className="p-2 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={next}
          disabled={currentSlide === TOTAL_SLIDES - 1}
          className="p-2 rounded-full border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Slide counter - bottom right */}
      <div className="fixed bottom-6 right-6 z-50 text-xs font-mono text-white/30">
        {String(currentSlide + 1).padStart(2, "0")} /{" "}
        {String(TOTAL_SLIDES).padStart(2, "0")}
      </div>

      {/* Keyboard hint - bottom left */}
      <div className="fixed bottom-6 left-6 z-50 text-xs font-mono text-white/20 hidden md:flex items-center gap-2">
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
          &uarr;
        </kbd>
        <kbd className="px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
          &darr;
        </kbd>
        <span>navigate</span>
      </div>
    </div>
  );
}
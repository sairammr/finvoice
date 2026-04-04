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

export default function Home() {
  return (
    <div>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-lime-100">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-8">
            <Link
              href="/marketplace"
              className="text-base text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Earn
            </Link>
            <Link
              href="/pitch"
              className="text-base text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Pitch
            </Link>
            <Link
              href="/marketplace"
              className={buttonVariants({
                size: "lg",
                className:
                  "bg-lime-400 text-lime-950 hover:bg-lime-500 rounded-full px-6 text-base font-semibold",
              })}
            >
              Launch App <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
        {/* Subtle grid bg */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(163,230,53,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        <div className="w-full pt-24 max-w-6xl mx-auto text-center relative">
          {/* Logo-masked video sits behind all hero copy */}
          <HeroLogoMaskVideo
            className="absolute left-1/2 -top-40 z-0 h-[min(52rem,55vw)] w-[min(52rem,55vw)] -translate-x-1/2 mask-[url(/logo-mask.svg)] [-webkit-mask-image:url(/logo-mask.svg)] mask-center mask-no-repeat mask-contain"
            videoClassName="filter hue-rotate-270"
          />

          <div className="relative z-10">
            {/* Spacer lines up with the masked video area */}
            <div
              className="relative mx-auto w-full min-h-[min(17rem,52vw)]"
              aria-hidden
            />

            <motion.h1
              className="font-heading text-6xl md:text-8xl tracking-tight leading-[0.85] mb-6 mt-24"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
            >
              Turn unpaid invoices into{` `}
              <span className="text-lime-500 relative">
                instant capital
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                >
                  <path
                    d="M2 8c50-6 100-6 150-2s100 2 146-4"
                    stroke="#a3e635"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </motion.h1>

            <motion.p
              className="text-xl sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 leading-relaxed"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2}
            >
              Suppliers get paid today, not in 30 days. Debtors approve with one
              click. Funders earn{" "}
              <span className="font-semibold text-foreground">
                up to 26% APY
              </span>{" "}
              on risk-scored receivables.
            </motion.p>

            <motion.p
              className="text-base text-muted-foreground mb-10"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={2.5}
            >
              All private. All on-chain. No wallets required.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={3}
            >
              <Link
                href="/create-invoice"
                className={buttonVariants({
                  size: "lg",
                  className:
                    "bg-lime-400 text-lime-950 hover:bg-lime-500 rounded-full h-12 px-8 text-base font-semibold shadow-lg shadow-lime-400/25",
                })}
              >
                Get Paid Today <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/marketplace"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "rounded-full h-12 px-8 text-base border-lime-200 hover:bg-lime-50",
                })}
              >
                Earn Yield <TrendingUp className="ml-1.5 h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <div className="inline-flex items-center gap-2 bg-lime-50 border border-lime-200 rounded-full px-4 py-1.5 text-sm text-lime-700 mt-8">
                <Zap className="h-3.5 w-3.5" />
                Built on Flare Privacy Infrastructure
              </div>
            </motion.div>

            <motion.div
              className="mt-16"
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <ChevronDown className="h-5 w-5 text-lime-400 mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* PAS — Problem Agitation Solution */}
      <section className="px-6 py-24 md:py-32 border-t border-lime-100">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-mono text-lime-600 tracking-widest uppercase mb-4">
              The Problem
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl mb-4">
              Invoice factoring is stuck in 1995
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              A $3.1 trillion market still runs on faxed PDFs, manual
              reconciliation, and zero debtor consent.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: AlertTriangle,
                title: "No debtor consent",
                desc: "Invoices tokenized unilaterally. No verification. No trust signal for buyers.",
                color: "text-gray-500",
                bg: "bg-gray-50",
                border: "border-gray-200",
              },
              {
                icon: EyeOff,
                title: "Privacy violations",
                desc: "Factoring means handing over your client list. Business relationships become public.",
                color: "text-gray-500",
                bg: "bg-gray-50",
                border: "border-gray-200",
              },
              {
                icon: Clock,
                title: "Weeks to settle",
                desc: "Manual credit checks, paper trails, and bank processing. Suppliers wait 30-90 days.",
                color: "text-gray-500",
                bg: "bg-gray-50",
                border: "border-gray-200",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                className={`${item.bg} border ${item.border} rounded-2xl p-6`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className={`w-6 h-6 ${item.color} mb-4`} />
                <h3 className="font-heading text-2xl mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center bg-lime-50 border border-lime-200 rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <CheckCircle className="w-8 h-8 text-lime-600 mx-auto mb-4" />
            <h3 className="font-heading text-3xl mb-3">
              Finvoice fixes all three
            </h3>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Debtor-approved invoices. AI-scored risk on a sovereign Privacy
              Node. Sub-second settlement. One PDF, one click.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="px-6 py-24 md:py-32 bg-linear-to-b from-lime-50/50 to-white">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-mono text-lime-600 tracking-widest uppercase mb-4">
              Three Roles, One Platform
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl mb-4">
              Everyone wins
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              Whether you need cash today, want to approve faster, or are
              looking for real yield &mdash; there&rsquo;s a seat for you.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Supplier */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
            >
              <div className="bg-white border border-lime-200 rounded-2xl p-7 h-full group-hover:shadow-lg group-hover:shadow-lime-100/60 transition-all duration-300">
                <div className="w-full h-28 rounded-xl bg-lime-50 mb-5 overflow-hidden flex items-center justify-center p-2">
                  <SupplierAnim />
                </div>
                <h3 className="font-heading text-2xl mb-2">Supplier</h3>
                <p className="text-base font-medium text-lime-700 mb-4">
                  Get paid today, not in 30&ndash;90 days.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Upload your invoice, send it for approval, and receive up to
                  98% of its face value instantly. No banks, no paperwork, no
                  waiting.
                </p>
                <div className="space-y-2.5 pt-4 border-t border-lime-100">
                  {[
                    "Instant liquidity on approved invoices",
                    "Keep your client relationships private",
                    "No minimum invoice size",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-lime-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Debtor */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
            >
              <div className="bg-white border border-gray-200 rounded-2xl p-7 h-full group-hover:shadow-lg group-hover:shadow-gray-100/60 transition-all duration-300">
                <div className="w-full h-28 rounded-xl bg-gray-50 mb-5 overflow-hidden flex items-center justify-center p-2">
                  <DebtorAnim />
                </div>
                <h3 className="font-heading text-2xl mb-2">Debtor</h3>
                <p className="text-base font-medium text-zinc-700 mb-4">
                  One click. Full control.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  You approve the invoice in a PDF link &mdash; no wallet, no
                  sign-up. Your identity stays on a private chain. You still pay
                  the same amount on the same date.
                </p>
                <div className="space-y-2.5 pt-4 border-t border-gray-100">
                  {[
                    "Nothing changes about your payment terms",
                    "Your identity never goes public",
                    "Build an on-chain credit history privately",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Shield className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Funder */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
            >
              <div className="bg-white border border-lime-200 rounded-2xl p-7 h-full group-hover:shadow-lg group-hover:shadow-lime-100/60 transition-all duration-300">
                <div className="w-full h-28 rounded-xl bg-lime-50 mb-5 overflow-hidden flex items-center justify-center p-2">
                  <FunderAnim />
                </div>
                <h3 className="font-heading text-2xl mb-2">Funder</h3>
                <p className="text-base font-medium text-lime-700 mb-4">
                  Earn real yield, not speculation.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed mb-6">
                  Buy invoices at a discount. AI scores the risk for you. When
                  the debtor pays at maturity, you receive the full face value.
                  Up to 26% APY on Grade&nbsp;A paper.
                </p>
                <div className="space-y-2.5 pt-4 border-t border-lime-100">
                  {[
                    "AI-scored risk grades (A through D)",
                    "Short duration: 30 to 90 day returns",
                    "Backed by real receivables, not hype",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <TrendingUp className="w-4 h-4 text-lime-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom flow connector */}
          <motion.div
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <span className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-lime-500" />
              Supplier creates
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />
            <ChevronDown className="w-4 h-4 text-zinc-300 sm:hidden" />
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Debtor approves
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />
            <ChevronDown className="w-4 h-4 text-zinc-300 sm:hidden" />
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              AI scores
            </span>
            <ChevronRight className="w-4 h-4 text-zinc-300 hidden sm:block" />
            <ChevronDown className="w-4 h-4 text-zinc-300 sm:hidden" />
            <span className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" />
              Funder earns
            </span>
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section className="px-6 py-24 md:py-32">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-mono text-lime-600 tracking-widest uppercase mb-4">
              How It Works
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl mb-4">
              Four steps to instant liquidity
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: FileText,
                title: "Create",
                desc: "Supplier fills a form. Platform generates a special PDF with an approval button.",
                step: "01",
              },
              {
                icon: Shield,
                title: "Approve",
                desc: 'Debtor clicks "Approve on Flare" in the PDF. Invoice tokenized on Flare TEE.',
                step: "02",
              },
              {
                icon: Brain,
                title: "Score",
                desc: "AI reads private metadata, grades risk A-D, calculates yield. Attestation goes public.",
                step: "03",
              },
              {
                icon: DollarSign,
                title: "Fund",
                desc: "Funders purchase discounted invoices. Supplier gets paid instantly. Yield at maturity.",
                step: "04",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-10 -right-3 w-6">
                    <ArrowRight className="w-4 h-4 text-lime-300" />
                  </div>
                )}
                <div className="bg-white border border-lime-100 rounded-2xl p-6 h-full group-hover:border-lime-300 group-hover:shadow-lg group-hover:shadow-lime-100/50 transition-all duration-300">
                  <div className="text-sm font-mono text-lime-500 mb-3">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-lime-600" />
                  </div>
                  <h3 className="font-heading text-2xl mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Design */}
      <section className="px-6 py-24 md:py-32">
        <div className="w-full max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-mono text-lime-600 tracking-widest uppercase mb-4">
              Disclosure Design
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl mb-4">
              Privacy meets transparency
            </h2>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto">
              The AI sees everything. The public sees only what matters for
              pricing. Debtor identity{" "}
              <span className="font-semibold text-foreground">
                never leaves
              </span>{" "}
              the sovereign chain.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              className="bg-gray-50 border border-gray-200 rounded-2xl p-8"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-heading text-xl">Flare TEE</h3>
                  <p className="text-sm text-muted-foreground">
                    Sovereign, confidential
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  "Debtor identity & approval",
                  "Payment history (3+ years)",
                  "Jurisdiction & compliance",
                  "Commercial terms",
                  "Full AI reasoning",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm bg-white rounded-lg p-3 border"
                  >
                    <Lock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="bg-lime-50 border border-lime-200 rounded-2xl p-8"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-lime-200 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-lime-700" />
                </div>
                <div>
                  <h3 className="font-heading text-xl">Hedera HTS</h3>
                  <p className="text-sm text-muted-foreground">
                    Marketplace pricing signals
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  "Risk grade (A-D)",
                  "Annualized yield (APY)",
                  "Face value & purchase price",
                  "Maturity date & tenure",
                  "PDF verification hash",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm bg-white rounded-lg p-3 border border-lime-100"
                  >
                    <Eye className="w-4 h-4 text-lime-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Yield Example */}
      <section className="px-6 py-24 md:py-32 bg-lime-50/50 border-y border-lime-100">
        <div className="w-full max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-mono text-lime-600 tracking-widest uppercase mb-4">
              Real Yield
            </p>
            <h2 className="font-heading text-5xl sm:text-6xl mb-4">
              Not speculation. Time-value arbitrage.
            </h2>
          </motion.div>

          <motion.div
            className="bg-white border border-lime-200 rounded-2xl p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-sm font-mono text-lime-600 mb-4">
              Example: $100k invoice, 30-day maturity, Grade A
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Face value", value: "$100,000" },
                { label: "Purchase price", value: "$97,900" },
                { label: "Funder yield", value: "$2,100" },
                { label: "Annualized APY", value: "26.1%", accent: true },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
                    {item.label}
                  </div>
                  <div
                    className={`text-3xl font-bold ${item.accent ? "text-lime-600" : ""}`}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              {
                label: "Supplier gets",
                value: "$97,900",
                sub: "Paid instantly",
              },
              {
                label: "Debtor pays",
                value: "$100,000",
                sub: "Same as always",
              },
              {
                label: "Platform fee",
                value: "0.3%",
                sub: "At settlement only",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="bg-white border border-lime-100 rounded-xl p-5"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {item.label}
                </div>
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-sm text-lime-600 mt-1">{item.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="px-6 py-24 md:py-32 bg-lime-400">
        <div className="w-full max-w-5xl mx-auto">
          <div className="grid font-heading grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$3.1T", label: "Global factoring market" },
              { value: "<1s", label: "Flare finality" },
              { value: "26%", label: "APY on Grade A" },
              { value: "0", label: "Wallets required" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-7xl sm:text-8xl font-bold text-lime-950 mb-3">
                  {stat.value}
                </div>
                <div className="text-lg text-lime-800">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 md:py-32">
        <div className="w-full max-w-3xl mx-auto text-center">
          <motion.h2
            className="font-heading text-6xl sm:text-7xl mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Three trillion dollar market. <br />
            <span className="text-lime-500">One click.</span>
          </motion.h2>
          <motion.p
            className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Debtor approved it. AI scored it. Funder earned yield. Supplier got
            cash. Private data never leaked.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href="/create-invoice"
              className={buttonVariants({
                size: "lg",
                className:
                  "bg-lime-400 text-lime-950 hover:bg-lime-500 rounded-full h-14 px-10 text-lg font-semibold shadow-lg shadow-lime-400/25",
              })}
            >
              Start Factoring <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/pitch"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className:
                  "rounded-full h-14 px-10 text-lg border-lime-200 hover:bg-lime-50",
              })}
            >
              <Presentation className="mr-2 h-5 w-5" />
              View Pitch Deck
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-lime-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="text-sm text-muted-foreground">
            Private invoice factoring on Flare
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/create-invoice" className="hover:text-foreground">
              Create
            </Link>
            <Link href="/marketplace" className="hover:text-foreground">
              Market
            </Link>
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Link href="/pitch" className="hover:text-foreground">
              Pitch
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

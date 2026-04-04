"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Info,
  Loader2,
  AlertTriangle,
  Wallet,
  Brain,
  Clock,
  FileText,
  TrendingUp,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import {
  formatCurrency,
  formatBps,
  formatDate,
  type MarketplaceListing,
  type AiScoring,
} from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type RiskFilter = "All" | "A" | "B" | "C" | "D";
type SortBy = "yield" | "faceValue" | "tenure" | "riskGrade";
type SortDir = "asc" | "desc";

/* ── Grade config ── */

const gradeConfig: Record<
  string,
  {
    bg: string;
    text: string;
    ring: string;
    bar: string;
    color: string;
    label: string;
    icon: typeof ShieldCheck;
  }
> = {
  A: {
    bg: "bg-lime-50",
    text: "text-lime-700",
    ring: "ring-lime-200",
    bar: "bg-lime-400",
    color: "#65a30d",
    label: "Low Risk",
    icon: ShieldCheck,
  },
  B: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-200",
    bar: "bg-blue-400",
    color: "#2563eb",
    label: "Moderate",
    icon: Shield,
  },
  C: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    ring: "ring-amber-200",
    bar: "bg-amber-400",
    color: "#d97706",
    label: "Elevated",
    icon: ShieldAlert,
  },
  D: {
    bg: "bg-red-50",
    text: "text-red-700",
    ring: "ring-red-200",
    bar: "bg-red-400",
    color: "#dc2626",
    label: "High Risk",
    icon: ShieldAlert,
  },
};

function getGrade(g: string) {
  return gradeConfig[g] || gradeConfig.B;
}

const riskGradeSort: Record<string, number> = { A: 1, B: 2, C: 3, D: 4 };

/* ── Scoring helpers ── */

const factorKeys = [
  "paymentHistory",
  "jurisdictionRisk",
  "invoiceValidity",
  "complianceCheck",
] as const;

const factorLabels: Record<string, string> = {
  paymentHistory: "Payment History",
  jurisdictionRisk: "Jurisdiction Risk",
  invoiceValidity: "Invoice Validity",
  complianceCheck: "Compliance Check",
};

const factorIcons: Record<string, React.ElementType> = {
  paymentHistory: Clock,
  jurisdictionRisk: Shield,
  invoiceValidity: FileText,
  complianceCheck: Brain,
};

function getFactorScore(value: string): number {
  const v = value.toLowerCase();
  if (
    v.includes("excellent") ||
    v.includes("clear") ||
    v.includes("valid —") ||
    v.includes("low —") ||
    v.includes("low -")
  )
    return 90;
  if (v.includes("good") || v.includes("low-medium") || v.includes("low "))
    return 72;
  if (
    v.includes("medium-high") ||
    v.includes("concerns") ||
    v.includes("additional review") ||
    v.includes("limited")
  )
    return 40;
  if (v.includes("poor") || v.includes("high risk")) return 20;
  return 55;
}

function computeListingScoring(listing: MarketplaceListing): AiScoring {
  const grade = listing.riskGrade;
  const validityFactor =
    grade === "A" || grade === "B"
      ? "Valid — amounts and dates verified on-chain"
      : "Concerns — requires additional verification";
  const complianceFactor =
    grade === "A" || grade === "B"
      ? "Clear — no sanctions flags detected"
      : "Additional review recommended";

  return {
    invoiceId: listing.invoiceId,
    riskGrade: grade,
    discountBps: listing.discountBps,
    yieldBps: listing.yieldBps,
    confidenceScore: listing.confidenceScore,
    reasoning: `Invoice ${listing.invoiceId} scored grade ${grade} with ${listing.confidenceScore}% AI confidence. Discount rate: ${formatBps(listing.discountBps)}, annualized yield: ${formatBps(listing.yieldBps)}. Risk factors were assessed via Privacy Node using privacy-preserving computation.`,
    factors: {
      paymentHistory: "Payment history assessed via Privacy Node",
      jurisdictionRisk: "Jurisdiction risk assessed via Privacy Node",
      invoiceValidity: validityFactor,
      complianceCheck: complianceFactor,
    },
  };
}

/* ── Confidence Gauge (semicircular arc) ── */

function ConfidenceGauge({
  value,
  color,
  size = 120,
}: {
  value: number;
  color: string;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: size, height: size * 0.6 }}
    >
      <svg
        width={size}
        height={size * 0.6}
        viewBox={`0 0 ${size} ${size * 0.6}`}
        className="overflow-visible"
      >
        <path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${strokeWidth / 2} ${size * 0.55} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size * 0.55}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute bottom-0 text-center">
        <motion.span
          className="text-xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {value}%
        </motion.span>
      </div>
    </div>
  );
}

/* ── Factor Radar Chart ── */

function FactorRadar({
  factors,
  color,
}: {
  factors: Record<string, string>;
  color: string;
}) {
  const labels = [
    "Payment\nHistory",
    "Jurisdiction\nRisk",
    "Invoice\nValidity",
    "Compliance\nCheck",
  ];
  const keys = [
    "paymentHistory",
    "jurisdictionRisk",
    "invoiceValidity",
    "complianceCheck",
  ];
  const scores = keys.map((k) => getFactorScore(factors[k] || ""));

  const cx = 100,
    cy = 100,
    maxR = 65;
  const angles = keys.map(
    (_, i) => Math.PI / 2 + (2 * Math.PI * i) / keys.length,
  );

  const pointsStr = scores
    .map((s, i) => {
      const r = (s / 100) * maxR;
      return `${cx + r * Math.cos(angles[i])},${cy - r * Math.sin(angles[i])}`;
    })
    .join(" ");

  const rings = [25, 50, 75, 100];

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[180px] mx-auto">
      {rings.map((pct) => (
        <polygon
          key={pct}
          points={angles
            .map((a) => {
              const r = (pct / 100) * maxR;
              return `${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`;
            })
            .join(" ")}
          fill="none"
          stroke="#e4e4e7"
          strokeWidth={0.5}
        />
      ))}
      {angles.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + maxR * Math.cos(a)}
          y2={cy - maxR * Math.sin(a)}
          stroke="#e4e4e7"
          strokeWidth={0.5}
        />
      ))}
      <motion.polygon
        points={pointsStr}
        fill={color}
        fillOpacity={0.15}
        stroke={color}
        strokeWidth={1.5}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      {scores.map((s, i) => {
        const r = (s / 100) * maxR;
        return (
          <motion.circle
            key={i}
            cx={cx + r * Math.cos(angles[i])}
            cy={cy - r * Math.sin(angles[i])}
            r={3}
            fill={color}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
          />
        );
      })}
      {labels.map((label, i) => {
        const labelR = maxR + 20;
        const x = cx + labelR * Math.cos(angles[i]);
        const y = cy - labelR * Math.sin(angles[i]);
        const lines = label.split("\n");
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[7px] fill-zinc-500 font-medium"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={x} dy={li === 0 ? 0 : 9}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Metric Bar ── */

function MetricBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = Math.min((value / maxValue) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500">{label}</span>
        <span className="text-[11px] font-bold" style={{ color }}>
          {formatBps(value)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

/* ── Confidence Dot (table) ── */

function ConfidenceDot({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-lime-400"
      : score >= 60
        ? "bg-emerald-400"
        : score >= 40
          ? "bg-amber-400"
          : "bg-red-400";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-block size-1.5 rounded-full ${color}`} />
      <span className="tabular-nums">{score}%</span>
    </span>
  );
}

/* ── Sort Header ── */

function SortHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align = "right",
}: {
  label: string;
  sortKey: SortBy;
  currentSort: SortBy;
  currentDir: SortDir;
  onSort: (key: SortBy) => void;
  align?: "left" | "right";
}) {
  const active = currentSort === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`group inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wider transition-colors ${
        active ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
      } ${align === "right" ? "justify-end" : ""}`}
    >
      {label}
      <span className="flex flex-col">
        {active ? (
          currentDir === "desc" ? (
            <ArrowDown className="size-3" />
          ) : (
            <ArrowUp className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </span>
    </button>
  );
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function diceBearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}&size=64&radius=50&backgroundType=gradientLinear&backgroundRotation=0,360&scale=90`;
}

function fnv32(str: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0").toUpperCase();
}

function formatInvoiceLabel(id: string): string {
  const h = fnv32(id);
  return `0x${h.slice(0, 4)}·${h.slice(4)}`;
}

/* ── AI Scoring Popover ── */

function ScoringPopover({
  listing,
  onFund,
  recentlyFunded,
}: {
  listing: MarketplaceListing;
  onFund: (listing: MarketplaceListing) => void;
  recentlyFunded: Set<string>;
}) {
  const scoring = computeListingScoring(listing);
  const gc = getGrade(listing.riskGrade);
  const isFunded = listing.funded || recentlyFunded.has(listing.id);
  const isHighRisk = listing.riskGrade === "D";

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex h-7 items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 hover:text-purple-800 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      >
        <ShieldCheck className="size-3" />
        View Attestation
      </PopoverTrigger>
      <PopoverContent
        className="w-[680px] p-0 shadow-xl"
        align="end"
        side="bottom"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center gap-3 border-b border-zinc-100 px-4 py-3 ${gc.bg} rounded-t-lg`}
        >
          <img
            src={diceBearUrl(listing.invoiceId)}
            alt=""
            className="size-9 shrink-0 rounded-full ring-2 ring-white/70"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">
              {formatInvoiceLabel(listing.invoiceId)}
            </p>
            <p className="font-mono text-[11px] text-zinc-500">
              {listing.invoiceId} &middot; {listing.tenure}d tenure
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                Confidence
              </p>
              <p
                className="text-sm font-bold tabular-nums"
                style={{ color: gc.color }}
              >
                {scoring.confidenceScore}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">
                Yield
              </p>
              <p className="text-sm font-bold tabular-nums text-lime-600">
                {formatBps(listing.discountBps)}
              </p>
            </div>
            <span className="text-[10px] font-bold" style={{ color: gc.color }}>
              {scoring.confidenceScore}%
            </span>
          </div>
        </div>

        {/* Visualizations row: Gauge + Radar + Pricing */}
        <div className="grid grid-cols-3 gap-0 divide-x divide-zinc-100 border-b border-zinc-100">
          {/* Confidence Gauge */}
          <div className="flex flex-col items-center justify-center p-4">
            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Confidence
            </p>
            <ConfidenceGauge
              value={scoring.confidenceScore}
              color={gc.color}
              size={110}
            />
            <p className="text-[9px] text-zinc-400 mt-1">
              Attestation certainty
            </p>
          </div>

          {/* Radar Chart */}
          <div className="flex flex-col items-center justify-center p-3">
            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider mb-0">
              Factor Analysis
            </p>
            <FactorRadar factors={scoring.factors} color={gc.color} />
          </div>

          {/* Pricing Metrics */}
          <div className="flex flex-col justify-center p-4 space-y-2.5">
            <p className="text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
              Pricing
            </p>
            <MetricBar
              label="Discount"
              value={listing.discountBps}
              maxValue={1200}
              color={gc.color}
            />
            <MetricBar
              label="APY"
              value={listing.yieldBps}
              maxValue={15000}
              color="#16a34a"
            />
            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">You Pay</span>
                <span className="text-[11px] font-bold tabular-nums text-zinc-900">
                  {formatCurrency(listing.purchasePrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">You Receive</span>
                <span className="text-[11px] font-bold tabular-nums text-zinc-900">
                  {formatCurrency(listing.faceValue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-lime-600">Net Profit</span>
                <span className="text-[11px] font-bold tabular-nums text-lime-700">
                  +{formatCurrency(listing.faceValue - listing.purchasePrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Factor details + Reasoning */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-zinc-100">
          {/* Factor bars */}
          <div className="p-4 space-y-2.5">
            <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">
              Factor Scores
            </p>
            {factorKeys.map((key) => {
              const score = getFactorScore(
                scoring.factors[key as keyof typeof scoring.factors],
              );
              const Icon = factorIcons[key];
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3 text-zinc-400" />
                      <span className="text-[10px] font-medium text-zinc-600">
                        {factorLabels[key]}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-400">
                      {score}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: gc.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{
                        duration: 0.6,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-tight">
                    {scoring.factors[key as keyof typeof scoring.factors]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reasoning + Maturity */}
          <div className="p-4 space-y-3">
            <div className={`rounded-lg border border-zinc-200 ${gc.bg} p-3`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <ShieldCheck className="h-3 w-3" style={{ color: gc.color }} />
                <p
                  className="text-[9px] font-semibold uppercase tracking-wider"
                  style={{ color: gc.color }}
                >
                  Attestation Reasoning
                </p>
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-600">
                {scoring.reasoning}
              </p>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-500 space-y-1">
              <div className="flex justify-between">
                <span>Maturity</span>
                <strong className="text-zinc-700">
                  {formatDate(listing.maturityDate)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Tenure</span>
                <strong className="text-zinc-700">{listing.tenure} days</strong>
              </div>
              <div className="flex justify-between">
                <span>Risk-adjusted</span>
                <strong className="text-zinc-700">
                  {(
                    listing.yieldBps / Math.max(listing.discountBps, 1)
                  ).toFixed(1)}
                  x
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="border-t border-zinc-100 px-4 py-3">
          {isFunded ? (
            <div className="flex items-center justify-center rounded-md bg-zinc-50 py-2 text-xs font-medium text-zinc-400">
              Already funded
            </div>
          ) : isHighRisk ? (
            <div className="flex items-center justify-center gap-1.5 rounded-md border border-red-200 bg-red-50 py-2 text-xs font-medium text-red-600">
              <ShieldAlert className="size-3.5" />
              High Risk — Not available for funding
            </div>
          ) : (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFund(listing);
              }}
              className="w-full bg-lime-400 text-xs font-semibold text-lime-950 hover:bg-lime-500"
            >
              Fund {formatCurrency(listing.purchasePrice)}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ── Main Page ── */


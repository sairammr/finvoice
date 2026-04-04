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

export default function MarketplacePage() {
  const [apiListings, setApiListings] = useState<MarketplaceListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");
  const [hideFunded, setHideFunded] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("yield");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] =
    useState<MarketplaceListing | null>(null);
  const [recentlyFunded, setRecentlyFunded] = useState<Set<string>>(new Set());
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const walletAddress = wallets[0]?.address;

  const fetchWalletBalance = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const res = await fetch(`/api/balance?address=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.formatted);
      }
    } catch {
      setWalletBalance(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();
        if (data.listings) {
          setApiListings(data.listings);
        }
      } catch {
        // network error — show empty state
      } finally {
        setLoadingListings(false);
      }
    }
    fetchListings();
  }, []);

  useEffect(() => {
    if (fundDialogOpen && walletAddress) {
      fetchWalletBalance();
    }
  }, [fundDialogOpen, walletAddress, fetchWalletBalance]);

  function handleSort(key: SortBy) {
    if (sortBy === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...apiListings];
    if (riskFilter !== "All") {
      result = result.filter((l) => l.riskGrade === riskFilter);
    }
    if (hideFunded) {
      result = result.filter((l) => !l.funded && !recentlyFunded.has(l.id));
    }
    const dir = sortDir === "desc" ? -1 : 1;
    result.sort((a, b) => {
      switch (sortBy) {
        case "yield":
          return (a.discountBps - b.discountBps) * dir;
        case "faceValue":
          return (a.faceValue - b.faceValue) * dir;
        case "tenure":
          return (a.tenure - b.tenure) * dir;
        case "riskGrade":
          return (
            ((riskGradeSort[a.riskGrade] || 5) -
              (riskGradeSort[b.riskGrade] || 5)) *
            dir
          );
        default:
          return 0;
      }
    });
    return result;
  }, [apiListings, riskFilter, sortBy, sortDir, hideFunded, recentlyFunded]);

  const stats = useMemo(() => {
    const all = apiListings;
    const unfunded = all.filter((l) => !l.funded);
    const funded = all.filter((l) => l.funded);
    const total = all.reduce((s, l) => s + l.faceValue, 0);
    const available = unfunded.reduce((s, l) => s + l.faceValue, 0);
    const avgDiscount =
      all.length > 0
        ? all.reduce((s, l) => s + l.discountBps, 0) / all.length
        : 0;
    const avgConf =
      all.length > 0
        ? Math.round(
            all.reduce((s, l) => s + l.confidenceScore, 0) / all.length,
          )
        : 0;
    const bestDiscount =
      unfunded.length > 0 ? Math.max(...unfunded.map((l) => l.discountBps)) : 0;
    return {
      total,
      available,
      avgDiscount,
      avgConf,
      bestDiscount,
      count: all.length,
      fundedCount: funded.length,
    };
  }, [apiListings]);

  function handleFundClick(listing: MarketplaceListing) {
    setFundError(null);
    setSelectedListing(listing);
    setFundDialogOpen(true);
  }

  async function handleConfirmFund() {
    if (!selectedListing) return;
    if (!authenticated || !wallets[0]) {
      login();
      return;
    }
    setFunding(true);
    setFundError(null);

    try {
      // Fund via backend API (Hedera HTS)
      const res = await fetch("/api/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedListing.invoiceId,
          funderHederaId: walletAddress || "0.0.0",
        }),
      });

      const result = await res.json();

      if (result.success) {
        setApiListings((prev) =>
          prev.map((l) =>
            l.id === selectedListing.id
              ? { ...l, funded: true, funder: walletAddress || "" }
              : l,
          ),
        );
        setRecentlyFunded((prev) => new Set(prev).add(selectedListing.id));
        setFundDialogOpen(false);
        setSelectedListing(null);
      } else {
        setFundError(
          "Transaction sent but not confirmed yet. Check your wallet.",
        );
      }
    } catch (err: any) {
      console.error("Fund failed:", err);
      setFundError(err?.message || "Transaction failed");
    } finally {
      setFunding(false);
    }
  }

  const riskGrades: RiskFilter[] = ["All", "A", "B", "C", "D"];
  const balanceNum = walletBalance !== null ? parseFloat(walletBalance) : null;
  const purchasePriceUsdr = selectedListing ? selectedListing.purchasePrice : 0;
  const insufficientBalance =
    balanceNum !== null &&
    purchasePriceUsdr > 0 &&
    balanceNum < purchasePriceUsdr;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ── Header ── */}
        <div>
          <h1 className="font-heading text-4xl tracking-tight text-gray-900 md:text-5xl">
            Earn
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Fund AI-scored invoices and earn fixed yield on real-world
            receivables
          </p>
        </div>

        {/* ── Stats ── */}
        <div
          data-tour="marketplace-stats"
          className="grid grid-cols-2 gap-3 md:grid-cols-4"
        >
          {loadingListings ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-gray-200 bg-white">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-24" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="size-3.5 text-gray-400" />
                    <p className="text-xs font-medium text-gray-400">
                      Total Market
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-gray-900">
                    {formatCurrency(stats.total)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.count} invoice{stats.count !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="size-3.5 text-lime-500" />
                    <p className="text-xs font-medium text-gray-400">
                      Available to Fund
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-gray-900">
                    {formatCurrency(stats.available)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {stats.fundedCount} already funded
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="size-3.5 text-lime-500" />
                    <p className="text-xs font-medium text-gray-400">
                      Best Yield / Invoice
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-lime-600">
                    {stats.bestDiscount > 0
                      ? formatBps(stats.bestDiscount)
                      : "\u2014"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    avg {formatBps(stats.avgDiscount)} per invoice
                  </p>
                </CardContent>
              </Card>
              <Card className="border-gray-200 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="size-3.5 text-purple-400" />
                    <p className="text-xs font-medium text-gray-400">
                      Avg Confidence
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-gray-900">
                    {stats.avgConf > 0 ? `${stats.avgConf}%` : "\u2014"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    across all invoices
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* ── Compounding note ── */}
        {!loadingListings && stats.count > 0 && (
          <div className="flex items-start gap-2.5 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm">
            <TrendingUp className="mt-0.5 size-4 shrink-0 text-lime-600" />
            <p className="text-lime-800">
              <span className="font-semibold">Earn 2–5% per invoice.</span>{" "}
              Reinvesting across consecutive 30-day invoices can compound to{" "}
              <span className="font-semibold">20–30% annualised returns</span> —
              without locking up capital long-term.
            </p>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <Card
          data-tour="marketplace-filters"
          className={`border-gray-200 bg-white shadow-sm ${loadingListings ? "opacity-40 pointer-events-none" : ""}`}
        >
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">
                Risk Grade
              </span>
              <div className="flex gap-0.5">
                {riskGrades.map((grade) => {
                  const isActive = riskFilter === grade;
                  const gc = grade !== "All" ? getGrade(grade) : null;
                  return (
                    <button
                      key={grade}
                      onClick={() => setRiskFilter(grade)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? gc
                            ? `${gc.bg} ${gc.text}`
                            : "bg-lime-400 text-lime-950"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      {grade}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHideFunded((v) => !v)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  hideFunded
                    ? "bg-zinc-800 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {hideFunded ? "Showing Available" : "Hide Funded"}
              </button>
              <p className="text-xs tabular-nums text-gray-400">
                {filteredAndSorted.length} result
                {filteredAndSorted.length !== 1 && "s"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Table (Desktop) ── */}
        {loadingListings ? (
          <Card className="hidden overflow-hidden border-gray-200 bg-white shadow-sm md:block">
            <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-3 flex gap-4">
              {["w-32", "w-24", "w-20", "w-16", "w-16", "w-20", "w-16"].map(
                (w, i) => (
                  <Skeleton
                    key={i}
                    className={`h-3 ${w} ${i > 1 ? "ml-auto" : ""}`}
                  />
                ),
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-5 w-14" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-6 w-8 rounded-full" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="hidden overflow-hidden border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="py-3 pl-5 pr-2 text-left">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Invoice
                      </span>
                    </th>
                    <th className="px-2 py-3 text-right">
                      <SortHeader
                        label="Face Value"
                        sortKey="faceValue"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-2 py-3 text-right">
                      <SortHeader
                        label="Yield / Tenure"
                        sortKey="yield"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-2 py-3 text-right">
                      <SortHeader
                        label="Tenure"
                        sortKey="tenure"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-2 py-3 text-right">
                      <SortHeader
                        label="Risk"
                        sortKey="riskGrade"
                        currentSort={sortBy}
                        currentDir={sortDir}
                        onSort={handleSort}
                      />
                    </th>
                    <th className="px-2 py-3 text-right">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        AI Score
                      </span>
                    </th>
                    <th className="px-2 py-3 text-left">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Tx Hash
                      </span>
                    </th>
                    <th className="px-2 py-3 text-right">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Details
                      </span>
                    </th>
                    <th className="py-3 pl-2 pr-5 text-right">
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Action
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredAndSorted.map((listing) => {
                      const isFunded =
                        listing.funded || recentlyFunded.has(listing.id);
                      const isHighRisk = listing.riskGrade === "D";
                      const gc = getGrade(listing.riskGrade);

                      return (
                        <motion.tr
                          key={listing.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isFunded ? 0.55 : 1 }}
                          exit={{ opacity: 0 }}
                          className={`group border-b border-gray-50 transition-colors ${isFunded ? "bg-gray-50/40" : ""}`}
                        >
                          {/* Invoice */}
                          <td className="py-4 pl-5 pr-2">
                            <div className="flex items-center gap-3">
                              <img
                                src={diceBearUrl(listing.invoiceId)}
                                alt=""
                                className="size-9 shrink-0 rounded-full ring-1 ring-gray-200"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                  {formatInvoiceLabel(listing.invoiceId)}
                                </p>
                                <p className="truncate text-xs font-mono text-gray-400">
                                  {listing.invoiceId}
                                </p>
                              </div>
                              {isFunded && (
                                <Badge className="ml-1 bg-gray-100 text-[10px] font-medium text-gray-500 shrink-0">
                                  Funded
                                </Badge>
                              )}
                            </div>
                          </td>
                          {/* Face Value */}
                          <td className="px-2 py-4 text-right">
                            <p className="text-sm font-medium tabular-nums text-gray-900">
                              {formatCurrency(listing.faceValue)}
                            </p>
                            <p className="text-[11px] tabular-nums text-gray-400">
                              {formatCurrency(listing.purchasePrice)}
                            </p>
                          </td>
                          {/* Yield / Tenure */}
                          <td className="px-2 py-4 text-right">
                            <p className="text-sm font-semibold tabular-nums text-lime-700">
                              {formatBps(listing.discountBps)}
                            </p>
                            <p className="text-[11px] tabular-nums text-gray-400">
                              {listing.tenure}d tenure
                            </p>
                          </td>
                          {/* Tenure */}
                          <td className="px-2 py-4 text-right">
                            <p className="text-sm tabular-nums text-gray-900">
                              {listing.tenure}d
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatDate(listing.maturityDate)}
                            </p>
                          </td>
                          {/* Risk Grade */}
                          <td className="px-2 py-4 text-right">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${gc.bg} ${gc.text}`}
                            >
                              {listing.riskGrade}
                            </span>
                          </td>
                          {/* AI Score */}
                          <td className="px-2 py-4 text-right text-xs text-gray-500">
                            <ConfidenceDot score={listing.confidenceScore} />
                          </td>
                          {/* Tx Hash */}
                          <td className="px-2 py-4">
                            {listing.txHash ? (
                              <a
                                href={`https://coston2-explorer.flare.network/tx/${listing.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-100 bg-zinc-50 px-2 py-1 font-mono text-[10px] text-zinc-500 transition-colors hover:border-zinc-200 hover:bg-zinc-100 hover:text-zinc-700"
                              >
                                {listing.txHash.slice(0, 8)}\u2026
                                {listing.txHash.slice(-6)}
                                <ExternalLink className="size-2.5 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-300">
                                \u2014
                              </span>
                            )}
                          </td>
                          {/* AI Analysis */}
                          <td className="px-2 py-4 text-right">
                            <ScoringPopover
                              listing={listing}
                              onFund={handleFundClick}
                              recentlyFunded={recentlyFunded}
                            />
                          </td>
                          {/* Action */}
                          <td className="py-4 pl-2 pr-5 text-right">
                            {isFunded ? (
                              <span className="text-xs text-gray-400">--</span>
                            ) : isHighRisk ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-8 border-red-200 text-xs text-red-400"
                              >
                                <ShieldAlert className="mr-1 size-3" />
                                Risky
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleFundClick(listing)}
                                className="h-8 bg-lime-400 text-xs font-semibold text-lime-950 hover:bg-lime-500"
                              >
                                Fund
                              </Button>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Cards (Mobile) ── */}
        {loadingListings ? (
          <div className="space-y-3 md:hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-8 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-8 w-full mt-3 rounded-md" />
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3 md:hidden">
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((listing, index) => {
                const isFunded =
                  listing.funded || recentlyFunded.has(listing.id);
                const isHighRisk = listing.riskGrade === "D";
                const gc = getGrade(listing.riskGrade);

                return (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: isFunded ? 0.6 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <Card
                      className={`border-gray-200 bg-white shadow-sm ${isFunded ? "bg-gray-50/60" : ""}`}
                    >
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={diceBearUrl(listing.invoiceId)}
                              alt=""
                              className="size-8 shrink-0 rounded-full ring-1 ring-gray-200"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {formatInvoiceLabel(listing.invoiceId)}
                              </p>
                              <p className="truncate text-[11px] font-mono text-gray-400">
                                {listing.invoiceId}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs font-bold ${gc.bg} ${gc.text}`}
                            >
                              {listing.riskGrade}
                            </span>
                            {isFunded && (
                              <Badge className="bg-gray-100 text-[10px] text-gray-500">
                                Funded
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              Face Value
                            </p>
                            <p className="text-sm font-medium tabular-nums text-gray-900">
                              {formatCurrency(listing.faceValue)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              Yield / Tenure
                            </p>
                            <p className="text-sm font-semibold tabular-nums text-lime-700">
                              {formatBps(listing.discountBps)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              Purchase Price
                            </p>
                            <p className="text-xs tabular-nums text-gray-500">
                              {formatCurrency(listing.purchasePrice)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                              Tenure
                            </p>
                            <p className="text-xs tabular-nums text-gray-500">
                              {listing.tenure}d &middot;{" "}
                              {formatDate(listing.maturityDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                          <div className="flex items-center gap-2">
                            <ScoringPopover
                              listing={listing}
                              onFund={handleFundClick}
                              recentlyFunded={recentlyFunded}
                            />
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <ConfidenceDot score={listing.confidenceScore} />
                            </span>
                          </div>
                          {!isFunded &&
                            (isHighRisk ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-7 border-red-200 text-[11px] text-red-400"
                              >
                                High Risk
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleFundClick(listing)}
                                className="h-7 bg-lime-400 text-[11px] font-semibold text-lime-950 hover:bg-lime-500"
                              >
                                Fund
                              </Button>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loadingListings && filteredAndSorted.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            No invoices match the selected filters.
          </div>
        )}
      </div>

      {/* ── Fund Confirmation Dialog ── */}
      <Dialog open={fundDialogOpen} onOpenChange={setFundDialogOpen}>
        <DialogContent className="bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Confirm Funding
            </DialogTitle>
            {selectedListing && (
              <DialogDescription className="text-gray-500">
                Review the details below before funding this invoice.
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedListing &&
            (() => {
              const gc = getGrade(selectedListing.riskGrade);
              const profit =
                selectedListing.faceValue - selectedListing.purchasePrice;
              return (
                <div className="space-y-4 py-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ring-1 ${gc.bg} ${gc.text} ${gc.ring}`}
                    >
                      <span className="text-sm font-bold">
                        {selectedListing.riskGrade}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-mono">
                        {selectedListing.invoiceId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Grade {selectedListing.riskGrade} &middot;{" "}
                        {selectedListing.tenure}d tenure
                      </p>
                    </div>
                  </div>

                  {walletAddress && (
                    <div className="flex items-center justify-between rounded-md border border-lime-200 bg-lime-50/50 px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Wallet className="size-3.5 text-lime-600" />
                        Paying from:{" "}
                        <span className="font-mono">
                          {truncateAddress(walletAddress)}
                        </span>
                      </div>
                      {walletBalance !== null && (
                        <span className="text-xs font-medium text-gray-700">
                          {parseFloat(walletBalance).toFixed(2)} HBAR
                        </span>
                      )}
                    </div>
                  )}

                  {insufficientBalance && (
                    <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      Insufficient HBAR balance. Fund your wallet from the
                      faucet first.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-3">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        You Pay
                      </p>
                      <p className="text-lg font-bold tabular-nums text-gray-900">
                        {formatCurrency(selectedListing.purchasePrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        You Receive
                      </p>
                      <p className="text-lg font-bold tabular-nums text-gray-900">
                        {formatCurrency(selectedListing.faceValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Supply APY
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-lime-600">
                        {formatBps(selectedListing.yieldBps)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Net Profit
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-lime-600">
                        +{formatCurrency(profit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Tenure
                      </p>
                      <p className="text-sm tabular-nums text-gray-700">
                        {selectedListing.tenure} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                        Maturity
                      </p>
                      <p className="text-sm text-gray-700">
                        {formatDate(selectedListing.maturityDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2 text-xs text-gray-500">
                    <Info className="size-3.5 shrink-0 text-gray-400" />
                    Attestation confidence: {selectedListing.confidenceScore}%
                    &middot; Discount: {formatBps(selectedListing.discountBps)}
                  </div>

                  {fundError && (
                    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {fundError}
                    </div>
                  )}
                </div>
              );
            })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setFundDialogOpen(false)}
              className="border-gray-200"
            >
              Cancel
            </Button>
            {!authenticated ? (
              <Button
                onClick={() => login()}
                className="gap-1.5 bg-lime-400 font-semibold text-lime-950 hover:bg-lime-500"
              >
                <Wallet className="size-3.5" />
                Connect Wallet
              </Button>
            ) : (
              <Button
                onClick={handleConfirmFund}
                disabled={funding || insufficientBalance}
                className="gap-1.5 bg-lime-400 font-semibold text-lime-950 hover:bg-lime-500"
              >
                {funding ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Confirm in wallet...
                  </>
                ) : (
                  `Fund ${selectedListing ? formatCurrency(selectedListing.purchasePrice) : ""}`
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

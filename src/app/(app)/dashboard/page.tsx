"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  formatCurrency,
  formatBps,
  formatDate,
  getRiskGradeColor,
} from "@/lib/data";
import { useRole } from "@/components/providers";
import { usePrivy } from "@privy-io/react-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  FileText,
  TrendingUp,
  DollarSign,
  Clock,
  Download,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Invoice } from "@/lib/data";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  pending_approval: "bg-yellow-100 text-yellow-700 border-yellow-300",
  approved: "bg-blue-100 text-blue-700 border-blue-300",
  scoring: "bg-purple-100 text-purple-700 border-purple-300",
  listed: "bg-lime-100 text-lime-700 border-lime-300",
  funded: "bg-green-100 text-green-700 border-green-300",
  settled: "bg-emerald-100 text-emerald-700 border-emerald-300",
};

function statusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="border-zinc-200">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-lime-50 text-lime-600">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-zinc-500">{label}</p>
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { role } = useRole();
  const { user } = usePrivy();
  const walletAddress = user?.wallet?.address ?? "";

  const [apiInvoices, setApiInvoices] = useState<any[]>([]);
  const [apiListings, setApiListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [settledIds, setSettledIds] = useState<Set<string>>(new Set());
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const invoicesUrl = walletAddress
          ? `/api/invoices?address=${encodeURIComponent(walletAddress)}`
          : "/api/invoices";
        const [invoicesRes, listingsRes] = await Promise.all([
          fetch(invoicesUrl),
          fetch("/api/listings"),
        ]);
        const invoicesData = await invoicesRes.json();
        const listingsData = await listingsRes.json();

        // Format Supabase invoices to match expected shape
        const formatted = (invoicesData.invoices || []).map((inv: any) => ({
          id: inv.id,
          supplier: inv.supplier_name,
          supplierAddress: inv.supplier_address,
          debtor: inv.debtor_name,
          debtorEmail: inv.debtor_email,
          amount: inv.face_value,
          currency: inv.currency || "USDC",
          terms: inv.terms,
          dueDate: inv.due_date,
          lineItems: inv.line_items || [],
          status: inv.status,
          createdAt: inv.created_at,
          approvedAt: inv.approved_at,
          tokenId: inv.token_id?.toString(),
          paymentHistory: inv.payment_history,
          jurisdiction: inv.jurisdiction,
        }));

        setApiInvoices(formatted);
        setApiListings(listingsData.listings || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [walletAddress]);

  const displayInvoices = apiInvoices;
  const displayListings = apiListings;

  // Supplier stats
  const totalInvoices = displayInvoices.length;
  const pendingApproval = displayInvoices.filter(
    (i: any) => i.status === "pending_approval",
  ).length;
  const listedCount = displayInvoices.filter(
    (i: any) => i.status === "listed",
  ).length;
  const fundedListings = displayListings.filter((l: any) => l.funded);
  const totalReceived = fundedListings.reduce(
    (sum, l) => sum + l.purchasePrice,
    0,
  );

  // Funder stats
  const platformFeeBps = 30; // 0.3%
  const activeInvestments = fundedListings.length;
  const totalInvested = fundedListings.reduce(
    (sum: number, l: any) => sum + l.purchasePrice,
    0,
  );
  const expectedPayout = fundedListings.reduce((sum: number, l: any) => {
    const fee = (l.faceValue * platformFeeBps) / 10000;
    return sum + (l.faceValue - fee);
  }, 0);
  const expectedYield = expectedPayout - totalInvested;
  const avgApy =
    fundedListings.length > 0
      ? fundedListings.reduce((sum: number, l: any) => sum + l.yieldBps, 0) /
        fundedListings.length
      : 0;

  // Find the matching listing for an invoice (by tokenId)
  function getListingForInvoice(inv: any) {
    return displayListings.find(
      (l: any) => String(l.tokenId) === String(inv.tokenId),
    );
  }

  async function handleSettle(inv: any) {
    const listing = getListingForInvoice(inv);
    if (!listing) return;
    setSettlingId(inv.id);
    try {
      const res = await fetch("/api/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id.replace("LST-", ""),
          invoiceId: inv.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettledIds((prev) => new Set(prev).add(inv.id));
      } else {
        console.error("Settle error:", data.error);
        alert("Settlement failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Settle request failed:", err);
      alert("Settlement request failed");
    } finally {
      setSettlingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading text-4xl md:text-5xl text-zinc-900">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Track your invoices, positions, and AI risk scorings
        </p>
      </motion.div>

      <Tabs defaultValue="supplier" className="space-y-6">
        <TabsList className="bg-zinc-100" data-tour="dashboard-tabs">
          <TabsTrigger value="supplier">Supplier View</TabsTrigger>
          <TabsTrigger value="funder">Funder View</TabsTrigger>
        </TabsList>

        {/* ── Supplier View ─────────────────────────────────────── */}
        <TabsContent value="supplier" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-zinc-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <StatCard
                icon={FileText}
                label="Total Invoices Created"
                value={totalInvoices}
              />
              <StatCard
                icon={Clock}
                label="Pending Approval"
                value={pendingApproval}
              />
              <StatCard
                icon={TrendingUp}
                label="Listed on Marketplace"
                value={listedCount}
              />
              <StatCard
                icon={DollarSign}
                label="Total Received"
                value={formatCurrency(totalReceived)}
              />
            </motion.div>
          )}

          {loading ? (
            <Card className="border-zinc-200">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-56 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-7 w-12 ml-auto rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-xl">Your Invoices</CardTitle>
                  <CardDescription>
                    All invoices you have created on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Debtor</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Terms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayInvoices.map((inv: any) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-medium">
                            {inv.id}
                          </TableCell>
                          <TableCell>{inv.debtor}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(inv.amount)}
                          </TableCell>
                          <TableCell className="uppercase text-xs tracking-wide text-zinc-500">
                            {inv.terms}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${statusColors[inv.status]} text-xs`}
                            >
                              {statusLabel(inv.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {formatDate(inv.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {(() => {
                                const listing = getListingForInvoice(inv);
                                const isFunded = listing?.funded;
                                const isSettled =
                                  settledIds.has(inv.id) ||
                                  inv.status === "settled";
                                const isSettling = settlingId === inv.id;

                                if (isSettled) {
                                  return (
                                    <span className="text-xs text-emerald-600 font-medium">
                                      Settled
                                    </span>
                                  );
                                }
                                if (isFunded) {
                                  return (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isSettling}
                                      onClick={() => handleSettle(inv)}
                                      className="border-lime-300 bg-lime-50 text-lime-700 hover:bg-lime-100 hover:text-lime-800 text-xs"
                                    >
                                      {isSettling ? (
                                        <span className="flex items-center gap-1.5">
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Settling...
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-1.5">
                                          <DollarSign className="h-3 w-3" />
                                          Settle
                                        </span>
                                      )}
                                    </Button>
                                  );
                                }
                                return null;
                              })()}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setViewingInvoice(inv as Invoice)
                                }
                              >
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* ── Funder View ───────────────────────────────────────── */}
        <TabsContent value="funder" className="space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-zinc-200">
                  <CardContent className="flex items-center gap-4 p-5">
                    <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3.5 w-28" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <StatCard
                icon={FileText}
                label="Active Investments"
                value={activeInvestments}
              />
              <StatCard
                icon={DollarSign}
                label="Total Invested"
                value={formatCurrency(totalInvested)}
              />
              <StatCard
                icon={TrendingUp}
                label="Expected Yield"
                value={formatCurrency(expectedYield)}
              />
              <StatCard
                icon={TrendingUp}
                label="Average APY"
                value={formatBps(avgApy)}
              />
            </motion.div>
          )}

          {loading ? (
            <Card className="border-zinc-200">
              <CardHeader>
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-60 mt-1" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-8 rounded-full" />
                      <Skeleton className="h-4 w-20 flex-1" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-7 w-16 ml-auto rounded-md" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Card className="border-zinc-200">
                <CardHeader>
                  <CardTitle className="text-xl">Funded Positions</CardTitle>
                  <CardDescription>
                    Invoices you have purchased on the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Risk Grade</TableHead>
                        <TableHead className="text-right">Face Value</TableHead>
                        <TableHead className="text-right">
                          Purchase Price
                        </TableHead>
                        <TableHead className="text-right">APY</TableHead>
                        <TableHead className="text-right">
                          Expected Payout
                        </TableHead>
                        <TableHead className="text-right">Net Yield</TableHead>
                        <TableHead className="text-right">Tenure</TableHead>
                        <TableHead>Maturity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundedListings.map((listing) => (
                        <TableRow key={listing.id}>
                          <TableCell className="font-medium">
                            {listing.invoiceId}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${getRiskGradeColor(listing.riskGrade)} px-2 font-bold`}
                            >
                              {listing.riskGrade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(listing.faceValue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(listing.purchasePrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatBps(listing.yieldBps)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-lime-700">
                            {formatCurrency(
                              listing.faceValue -
                                (listing.faceValue * platformFeeBps) / 10000,
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-600">
                            +
                            {formatCurrency(
                              listing.faceValue -
                                (listing.faceValue * platformFeeBps) / 10000 -
                                listing.purchasePrice,
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {listing.tenure}d
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {formatDate(listing.maturityDate)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 border-green-300 text-xs"
                            >
                              Awaiting Settlement
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      <Sheet
        open={!!viewingInvoice}
        onOpenChange={(open) => {
          if (!open) setViewingInvoice(null);
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {viewingInvoice && (
            <>
              <SheetHeader>
                <SheetTitle className="font-heading text-xl">
                  {viewingInvoice.id}
                </SheetTitle>
                <SheetDescription>
                  Invoice details and line items
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-6 px-4 pb-6">
                <div>
                  <Badge
                    variant="outline"
                    className={`${statusColors[viewingInvoice.status]} text-xs`}
                  >
                    {statusLabel(viewingInvoice.status)}
                  </Badge>
                </div>
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Supplier</dt>
                    <dd className="text-right font-medium text-zinc-900">
                      {viewingInvoice.supplier}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Debtor</dt>
                    <dd className="text-right font-medium text-zinc-900">
                      {viewingInvoice.debtor}
                    </dd>
                  </div>
                  {viewingInvoice.debtorEmail ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Debtor email</dt>
                      <dd className="text-right text-zinc-700">
                        {viewingInvoice.debtorEmail}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Amount</dt>
                    <dd className="text-right font-medium text-zinc-900">
                      {formatCurrency(viewingInvoice.amount)}{" "}
                      {viewingInvoice.currency}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Terms</dt>
                    <dd className="text-right uppercase tracking-wide text-zinc-700">
                      {viewingInvoice.terms}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Due</dt>
                    <dd className="text-right text-zinc-700">
                      {formatDate(viewingInvoice.dueDate)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Created</dt>
                    <dd className="text-right text-zinc-700">
                      {formatDate(viewingInvoice.createdAt)}
                    </dd>
                  </div>
                  {viewingInvoice.approvedAt ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Approved</dt>
                      <dd className="text-right text-zinc-700">
                        {formatDate(viewingInvoice.approvedAt)}
                      </dd>
                    </div>
                  ) : null}
                  {viewingInvoice.tokenId ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500">Invoice ID</dt>
                      <dd className="font-mono text-right text-xs text-zinc-700">
                        {viewingInvoice.tokenId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
                <Separator />
                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700">
                    Line items
                  </p>
                  <ul className="space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                    {(viewingInvoice.lineItems || []).length === 0 ? (
                      <li className="text-sm text-zinc-500">No line items</li>
                    ) : (
                      viewingInvoice.lineItems.map((line, idx) => (
                        <li
                          key={`${line.description}-${idx}`}
                          className="flex justify-between gap-2 text-sm"
                        >
                          <span className="text-zinc-800">
                            {line.description}
                          </span>
                          <span className="shrink-0 text-zinc-600">
                            {line.quantity} × {formatCurrency(line.unitPrice)}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <Link
                  href={`/api/generate-pdf?invoiceId=${encodeURIComponent(viewingInvoice.id)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "inline-flex w-full",
                  )}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

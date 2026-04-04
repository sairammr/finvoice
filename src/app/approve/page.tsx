"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  FileText,
  Shield,
  Clock,
  AlertTriangle,
  Loader2,
  Brain,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/data";

type ApprovalStep =
  | "verify"
  | "confirming"
  | "tokenizing"
  | "scoring"
  | "listed"
  | "complete";

function ApproveContent() {
  const searchParams = useSearchParams();
  /** Must match a row in Supabase (e.g. from PDF link `/approve?invoiceId=INV-…`). */
  const invoiceIdParam = searchParams.get("invoiceId");

  const [step, setStep] = useState<ApprovalStep>("verify");
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scoringResult, setScoringResult] = useState<any>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceIdParam) {
      setLoading(false);
      return;
    }
    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices`);
        const data = await res.json();
        const found = (data.invoices || []).find((i: any) => i.id === invoiceIdParam);
        if (found) {
          setInvoice({
            id: found.id,
            supplier: found.supplier_name,
            debtor: found.debtor_name,
            amount: found.face_value,
            terms: found.terms,
            dueDate: found.due_date,
            lineItems: found.line_items || [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch invoice:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [invoiceIdParam]);

  const displayInvoice = invoice;

  const canApprove = Boolean(invoice?.id);

  const handleApprove = async () => {
    if (!invoice?.id) {
      setApproveError(
        "This page must be opened with a valid invoice link (includes ?invoiceId=…) from your PDF or dashboard."
      );
      return;
    }
    setApproveError(null);
    setStep("confirming");

    try {
      setStep("tokenizing");
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Approval failed");
      }

      setStep("scoring");
      await new Promise((r) => setTimeout(r, 1000)); // Brief UX pause

      setStep("listed");
      if (data.scoring) {
        setScoringResult(data.scoring);
      }
      await new Promise((r) => setTimeout(r, 1000));

      setStep("complete");
    } catch (err) {
      console.error("Approval failed:", err);
      setApproveError(
        err instanceof Error ? err.message : "Approval failed. Try again."
      );
      setStep("verify");
    }
  };

  const steps = [
    {
      id: "confirming",
      label: "Confirming approval",
      icon: CheckCircle,
    },
    {
      id: "tokenizing",
      label: "Tokenizing on Privacy Node",
      icon: Shield,
    },
    {
      id: "scoring",
      label: "AI agent scoring invoice",
      icon: Brain,
    },
    {
      id: "listed",
      label: "Publishing to marketplace",
      icon: Sparkles,
    },
  ];

  const stepOrder: ApprovalStep[] = [
    "confirming",
    "tokenizing",
    "scoring",
    "listed",
    "complete",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
      </div>
    );
  }

  if (!displayInvoice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lime-50/50 to-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-amber-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-700" />
            </div>
            <CardTitle className="font-heading text-2xl">Invoice not found</CardTitle>
            <CardDescription>
              {invoiceIdParam
                ? <>No invoice with ID{" "}<span className="font-mono font-medium text-foreground">{invoiceIdParam}</span>{" "}exists in the database.</>
                : "No invoice ID provided."}{" "}
              Use the link from your generated invoice PDF, or create the
              invoice first from the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/"
              className={buttonVariants({ className: "w-full bg-lime-400 text-lime-950 hover:bg-lime-500" })}
            >
              Back to home
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-lime-50/50 to-white flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
        >
          <Card className="max-w-lg w-full text-center border-lime-200 shadow-lg">
            <CardContent className="pt-10 pb-10 space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 bg-lime-100 rounded-full flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-10 h-10 text-lime-600" />
              </motion.div>
              <div>
                <h2 className="font-heading text-3xl mb-2">
                  Invoice Approved
                </h2>
                <p className="text-muted-foreground">
                  {displayInvoice.id} has been tokenized and listed on the marketplace
                </p>
              </div>
              <div className="bg-lime-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Grade</span>
                  <Badge className="bg-lime-100 text-lime-700 border-lime-200">
                    {scoringResult?.riskGrade || "A"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yield APY</span>
                  <span className="font-semibold">
                    {scoringResult?.yieldBps ? (scoringResult.yieldBps / 100).toFixed(1) + "%" : "26.1%"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      scoringResult?.discountBps
                        ? displayInvoice.amount * (1 - scoringResult.discountBps / 10000)
                        : displayInvoice.amount * 0.979
                    )}
                  </span>
                </div>
              </div>
              <a
                href="/marketplace"
                className={buttonVariants({ className: "bg-lime-400 text-lime-950 hover:bg-lime-500 w-full" })}
              >
                View on Marketplace <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lime-50/50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        <Card className="border-lime-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-lime-600" />
            </div>
            <CardTitle className="font-heading text-2xl">
              Approve Invoice
            </CardTitle>
            <CardDescription>
              Review and approve this invoice on Flare
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Invoice Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Invoice ID</span>
                <span className="font-mono font-medium">{displayInvoice.id}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-medium">{displayInvoice.supplier}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(displayInvoice.amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Terms</span>
                <span>{displayInvoice.terms}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span>{formatDate(displayInvoice.dueDate)}</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Line Items
              </h4>
              {displayInvoice.lineItems.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex justify-between text-sm bg-white border rounded-md p-3"
                >
                  <span>{item.description}</span>
                  <span className="font-medium">
                    {item.quantity} x {formatCurrency(item.unitPrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 bg-lime-50 border border-lime-200 rounded-lg p-3">
              <Shield className="w-5 h-5 text-lime-600 mt-0.5 shrink-0" />
              <p className="text-xs text-lime-800">
                Your identity and approval details are stored on a Flare TEE (Trusted Execution Environment)
                Node. Only the risk grade and yield will be visible on the public
                marketplace.
              </p>
            </div>

            {/* Progress Steps */}
            <AnimatePresence>
              {step !== "verify" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-3 overflow-hidden"
                >
                  {steps.map((s, i) => {
                    const isActive = stepOrder[i] === step;
                    const isDone = currentStepIndex > i;
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-center gap-3 text-sm p-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-lime-50 text-lime-700"
                            : isDone
                              ? "text-lime-600"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isActive ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isDone ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>{s.label}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            {step === "verify" && (
              <div className="space-y-3">
                {approveError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {approveError}
                  </div>
                )}
                <Button
                  onClick={handleApprove}
                  disabled={!canApprove}
                  className="w-full bg-lime-400 text-lime-950 hover:bg-lime-500 h-12 text-base font-semibold disabled:opacity-50"
                >
                  <CheckCircle className="mr-2 h-5 w-5" />
                  Approve on Flare
                </Button>
                <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>This action is irreversible once confirmed</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function ApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
        </div>
      }
    >
      <ApproveContent />
    </Suspense>
  );
}

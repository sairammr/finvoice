"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  FileDown,
  CheckCircle,
  Send,
  Loader2,
  ArrowRight,
  Sparkles,
  User,
  ChevronRight,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function truncateAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function CreateInvoicePage() {
  const { primaryWallet } = useDynamicContext();
  const walletAddress = primaryWallet?.address ?? "";

  const [supplierName, setSupplierName] = useState("");
  const [debtorName, setDebtorName] = useState("");
  const [debtorEmail, setDebtorEmail] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [dueDate, setDueDate] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addLineItem = () =>
    setLineItems((p) => [
      ...p,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems((p) => p.filter((li) => li.id !== id));
  };

  const updateLineItem = (
    id: string,
    field: keyof Omit<LineItem, "id">,
    value: string | number,
  ) =>
    setLineItems((p) =>
      p.map((li) => (li.id === id ? { ...li, [field]: value } : li)),
    );

  const lineItemsTotal = lineItems.reduce(
    (s, li) => s + li.quantity * li.unitPrice,
    0,
  );
  const totalAmount = lineItemsTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName,
          supplierAddress: walletAddress,
          debtorName,
          debtorEmail,
          amount: lineItemsTotal,
          terms: paymentTerms,
          dueDate,
          lineItems: lineItems.map(({ description, quantity, unitPrice }) => ({
            description,
            quantity,
            unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedInvoiceId(data.invoice.id);
        setSuccessOpen(true);
      }
    } catch (err) {
      console.error("Failed to create invoice:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedDue = dueDate
    ? new Date(dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const termsLabel = paymentTerms
    ? paymentTerms.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 pb-16 pt-10">
      <div className="mx-auto max-w-5xl">
        {/* Page header */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-heading text-[2.6rem] leading-tight tracking-tight text-gray-950">
            Borrow against your Invoice
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create an invoice and borrow against it — once the debtor approves,
            it&apos;s tokenized on Flare and you can list it on the marketplace
            for instant liquidity.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
            {/* ── Left: form ── */}
            <div className="space-y-5">
              {/* ── From / To ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Parties
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* From */}
                  <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-lime-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-lime-700">
                          YOU
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        From · Supplier
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="supplierName"
                        className="text-xs text-gray-500"
                      >
                        Company / name
                      </Label>
                      <Input
                        id="supplierName"
                        placeholder="Acme Corp"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-lime-400 bg-transparent text-sm font-medium placeholder:text-gray-300 transition-colors"
                        required
                      />
                    </div>
                    {walletAddress && (
                      <p className="mt-3 font-mono text-[10px] text-gray-400 truncate">
                        {truncateAddress(walletAddress)}
                      </p>
                    )}
                  </div>

                  {/* To */}
                  <div className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-gray-100 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        To · Debtor
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="debtorName"
                          className="text-xs text-gray-500"
                        >
                          Company / name
                        </Label>
                        <Input
                          id="debtorName"
                          placeholder="Client LLC"
                          value={debtorName}
                          onChange={(e) => setDebtorName(e.target.value)}
                          className="border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-lime-400 bg-transparent text-sm font-medium placeholder:text-gray-300 transition-colors"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="debtorEmail"
                          className="text-xs text-gray-500"
                        >
                          Email
                          <span className="ml-1 text-gray-400 font-normal normal-case tracking-normal">
                            — receives approval PDF
                          </span>
                        </Label>
                        <Input
                          id="debtorEmail"
                          type="email"
                          placeholder="client@example.com"
                          value={debtorEmail}
                          onChange={(e) => setDebtorEmail(e.target.value)}
                          className="border-0 border-b border-gray-200 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-lime-400 bg-transparent text-sm placeholder:text-gray-300 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Payment details ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="rounded-2xl border border-gray-200 bg-white p-5"
              >
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Payment
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Payment terms
                    </Label>
                    <Select
                      value={paymentTerms}
                      onValueChange={(v) => v && setPaymentTerms(v)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="net-30">Net 30</SelectItem>
                        <SelectItem value="net-60">Net 60</SelectItem>
                        <SelectItem value="net-90">Net 90</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dueDate" className="text-xs text-gray-500">
                      Due date
                    </Label>
                    <Input
                      id="dueDate"
                      type="date"
                      min={today}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </motion.div>

              {/* ── Line items ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Line Items
                  </p>
                  {lineItemsTotal > 0 && (
                    <span className="text-xs font-semibold text-lime-700">
                      $
                      {lineItemsTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                  )}
                </div>

                {/* Column headers */}
                <div className="hidden sm:grid sm:grid-cols-[1fr_64px_96px_32px] gap-2 px-5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <span>Description</span>
                  <span className="text-center">Qty</span>
                  <span className="text-right pr-1">Unit price</span>
                  <span />
                </div>

                <div className="px-3 pb-3 space-y-1">
                  <AnimatePresence initial={false}>
                    {lineItems.map((li, idx) => {
                      const rowTotal = li.quantity * li.unitPrice;
                      return (
                        <motion.div
                          key={li.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{
                            opacity: 0,
                            x: -8,
                            transition: { duration: 0.15 },
                          }}
                          transition={{ duration: 0.18 }}
                        >
                          <div
                            className={`grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_64px_96px_32px] items-center rounded-xl px-2 py-2 transition-colors hover:bg-gray-50 ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
                          >
                            <Input
                              placeholder={`Item ${idx + 1}`}
                              value={li.description}
                              onChange={(e) =>
                                updateLineItem(
                                  li.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              className="h-8 border-0 bg-transparent px-1 text-sm shadow-none focus-visible:ring-0 placeholder:text-gray-300"
                              required
                            />
                            <Input
                              type="number"
                              min="1"
                              value={li.quantity}
                              onChange={(e) =>
                                updateLineItem(
                                  li.id,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="h-8 border-0 bg-transparent text-center px-1 text-sm shadow-none focus-visible:ring-0"
                              required
                            />
                            <div className="relative">
                              <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                $
                              </span>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={li.unitPrice === 0 ? "" : li.unitPrice}
                                placeholder="0"
                                onChange={(e) =>
                                  updateLineItem(
                                    li.id,
                                    "unitPrice",
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8 border-0 bg-transparent pl-4 pr-1 text-right text-sm shadow-none focus-visible:ring-0 placeholder:text-gray-300"
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeLineItem(li.id)}
                              disabled={lineItems.length <= 1}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400 disabled:pointer-events-none disabled:opacity-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {rowTotal > 0 && (
                            <div className="flex justify-end pr-9">
                              <span className="text-[10px] tabular-nums text-gray-400">
                                = $
                                {rowTotal.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={addLineItem}
                    className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-200 py-2 text-xs font-medium text-gray-400 transition-all hover:border-lime-400 hover:bg-lime-50 hover:text-lime-600"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add item
                  </button>
                </div>

                {/* Total row */}
                {lineItemsTotal > 0 && (
                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-5 py-3">
                    <span className="text-xs font-semibold text-gray-500">
                      Total
                    </span>
                    <span className="text-sm font-bold text-lime-700 tabular-nums">
                      $
                      {lineItemsTotal.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                  </div>
                )}
              </motion.div>

              {/* ── Submit ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="flex items-center justify-between pt-2"
              >
                <p className="text-xs text-gray-400">
                  Debtor will receive an approval PDF at{" "}
                  <span
                    className={debtorEmail ? "font-medium text-gray-600" : ""}
                  >
                    {debtorEmail || "their email"}
                  </span>
                </p>
                <Button
                  type="submit"
                  size="lg"
                  className="gap-2 bg-lime-400 text-lime-950 hover:bg-lime-500 font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Create Invoice
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* ── Right: live preview ── */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="overflow-hidden rounded-2xl border border-lime-200/80 bg-white shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-lime-100 bg-gradient-to-r from-lime-50 to-lime-50/40 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-lime-600" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-lime-700">
                        Preview
                      </span>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                      Draft
                    </span>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Amount hero */}
                    <div className="text-center">
                      <p className="text-[10px] font-medium uppercase tracking-widest text-gray-400 mb-1.5">
                        Invoice total
                      </p>
                      <motion.p
                        key={totalAmount}
                        initial={{ scale: 0.96 }}
                        animate={{ scale: 1 }}
                        className={`text-[2.4rem] font-bold leading-none tabular-nums transition-colors ${totalAmount > 0 ? "text-lime-600" : "text-gray-200"}`}
                      >
                        $
                        {totalAmount > 0
                          ? totalAmount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "0.00"}
                      </motion.p>
                      <p className="mt-1 text-[10px] text-gray-400">USDC</p>
                    </div>

                    {/* From → To */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5">
                        <div className="h-6 w-6 shrink-0 rounded-lg bg-lime-100 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-lime-700">
                            YOU
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                            From
                          </p>
                          <p
                            className={`text-sm font-semibold truncate leading-tight ${supplierName ? "text-gray-900" : "text-gray-300"}`}
                          >
                            {supplierName || "Supplier name"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300" />
                      </div>

                      <div className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 px-3.5 py-2.5">
                        <div className="h-6 w-6 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-medium uppercase tracking-wide text-gray-400">
                            To
                          </p>
                          <p
                            className={`text-sm font-semibold truncate leading-tight ${debtorName ? "text-gray-900" : "text-gray-300"}`}
                          >
                            {debtorName || "Debtor name"}
                          </p>
                          {debtorEmail && (
                            <p className="text-[10px] text-gray-400 truncate">
                              {debtorEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terms / Due pills */}
                    {(termsLabel || formattedDue) && (
                      <div className="flex gap-2">
                        {termsLabel && (
                          <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-center">
                            <p className="text-[9px] text-gray-400">Terms</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">
                              {termsLabel}
                            </p>
                          </div>
                        )}
                        {formattedDue && (
                          <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2 text-center">
                            <p className="text-[9px] text-gray-400">Due</p>
                            <p className="text-xs font-bold text-gray-800 mt-0.5">
                              {formattedDue}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Line items */}
                    {lineItems.some((li) => li.description) && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                          Items
                        </p>
                        {lineItems
                          .filter((li) => li.description)
                          .map((li) => (
                            <div
                              key={li.id}
                              className="flex items-start justify-between gap-2 text-xs"
                            >
                              <span className="text-gray-700 truncate flex-1 leading-relaxed">
                                {li.description}
                              </span>
                              <span className="text-gray-500 shrink-0 tabular-nums text-right">
                                {li.quantity > 1 && (
                                  <span className="text-gray-400">
                                    {li.quantity}×{" "}
                                  </span>
                                )}
                                $
                                {(li.quantity * li.unitPrice).toLocaleString(
                                  "en-US",
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  },
                                )}
                              </span>
                            </div>
                          ))}
                        {lineItems.filter((li) => li.description).length >
                          0 && (
                          <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-1.5 text-xs font-bold">
                            <span className="text-gray-600">Total</span>
                            <span className="text-lime-600 tabular-nums">
                              $
                              {lineItemsTotal.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}{" "}
                              USDC
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Flow hint */}
                    <div className="space-y-1.5">
                      {[
                        "Invoice tokenized on Flare",
                        "Debtor approves via OTP in PDF",
                        "List on marketplace for yield",
                      ].map((step, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-[11px] text-gray-400"
                        >
                          <ChevronRight className="h-3 w-3 shrink-0 text-lime-400" />
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ── Success dialog ── */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-100">
              <CheckCircle className="h-7 w-7 text-lime-600" />
            </div>
            <DialogTitle className="font-heading text-center text-2xl">
              Invoice Created!
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Pending debtor approval at{" "}
              <span className="font-medium text-gray-700">{debtorEmail}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/60 text-sm overflow-hidden">
            {[
              { label: "Invoice ID", value: generatedInvoiceId, mono: true },
              { label: "From", value: supplierName },
              { label: "To", value: debtorName },
              {
                label: "Amount",
                value: `$${lineItemsTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC`,
              },
              ...(termsLabel ? [{ label: "Terms", value: termsLabel }] : []),
              ...(dueDate ? [{ label: "Due", value: dueDate }] : []),
            ].map(({ label, value, mono }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 px-4 py-2.5"
              >
                <span className="text-gray-500 text-xs">{label}</span>
                <span
                  className={`font-medium text-right truncate max-w-[200px] ${mono ? "font-mono text-xs text-gray-600" : "text-gray-900"}`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5">
            <a
              href={`/api/generate-pdf?invoiceId=${generatedInvoiceId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileDown className="h-4 w-4" />
              View PDF
            </a>
            <Button
              className="flex-1 gap-1.5 bg-lime-400 text-lime-950 hover:bg-lime-500 font-semibold"
              onClick={() => setSuccessOpen(false)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

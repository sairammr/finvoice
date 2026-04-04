import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import { PDFDocument, rgb, StandardFonts, TextAlignment } from "pdf-lib";
import React from "react";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: 700 },
    { src: "Helvetica-Oblique", fontStyle: "italic" },
  ],
});

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  lime:     "#a3e635",
  limeDark: "#65a30d",
  limeBg:   "#f7fee7",
  ink:      "#111827",
  inkMid:   "#374151",
  muted:    "#6b7280",
  subtle:   "#9ca3af",
  surface:  "#f9fafb",
  border:   "#e5e7eb",
  white:    "#ffffff",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 310,
    paddingHorizontal: 44,
  },

  // ── Header: white with lime accent ──
  headerBand: {
    marginHorizontal: -44,
    paddingHorizontal: 44,
    paddingTop: 30,
    paddingBottom: 24,
    backgroundColor: C.white,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logoMark:     { flexDirection: "row", alignItems: "flex-end", marginBottom: 3 },
  logoNew:     { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.ink,      letterSpacing: -0.5 },
  logoWay:      { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.limeDark, letterSpacing: -0.5 },
  logoSub:      { fontSize: 7.5, color: C.subtle, letterSpacing: 2, textTransform: "uppercase" },
  headerRight:  { alignItems: "flex-end", gap: 3 },
  invoiceLabel: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 2 },
  invoiceId:    { fontSize: 17, fontFamily: "Helvetica-Bold", color: C.ink },
  statusBadge:  { backgroundColor: C.limeBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 },
  statusText:   { fontSize: 7.5, color: C.limeDark, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1 },
  accentRule:   { height: 3, backgroundColor: C.lime, marginHorizontal: -44 },

  // ── Amount hero ──
  amountSection: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
  },
  amountLabel:    { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 2, marginBottom: 5 },
  amountValue:    { fontSize: 38, fontFamily: "Helvetica-Bold", color: C.limeDark, letterSpacing: -1 },
  amountCurrency: { fontSize: 9, color: C.muted, marginTop: 3 },

  // ── Parties ──
  partiesRow: { flexDirection: "row", gap: 14, marginTop: 16 },
  partyCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    borderLeftWidth: 3,
    borderLeftColor: C.lime,
    borderLeftStyle: "solid",
  },
  partyCardTo:  { borderLeftColor: C.subtle },
  partyRole:    { fontSize: 7.5, color: C.limeDark, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5, fontFamily: "Helvetica-Bold" },
  partyRoleTo:  { color: C.muted },
  partyName:    { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  partyDetail:  { fontSize: 8.5, color: C.muted },

  // ── Details strip ──
  detailsStrip: { flexDirection: "row", marginTop: 12, gap: 1 },
  detailCell: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderStyle: "solid",
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  detailCellFirst: {},
  detailCellMid:   {},
  detailCellLast:  {},
  detailLabel: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 5 },
  detailValue: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },

  // ── Line items table ──
  tableWrap: { marginTop: 16 },
  tableHead: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: C.ink,
    borderRadius: 6,
    marginBottom: 1,
  },
  thText:   { fontSize: 7.5, color: "#d1d5db", textTransform: "uppercase", letterSpacing: 1, fontFamily: "Helvetica-Bold" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    borderBottomStyle: "solid",
  },
  tableRowAlt: { backgroundColor: C.surface },
  tdText:  { fontSize: 10, color: C.inkMid },
  tdMono:  { fontSize: 9,  color: C.muted, fontFamily: "Helvetica-Oblique" },
  colDesc:  { flex: 1 },
  colQty:   { width: 36, textAlign: "right" },
  colPrice: { width: 76, textAlign: "right" },
  colTotal: { width: 82, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: C.ink,
    borderRadius: 6,
    marginTop: 1,
  },
  totalLabel: { flex: 1, fontSize: 11, color: C.white, fontFamily: "Helvetica-Bold" },
  totalValue: { width: 82, textAlign: "right", fontSize: 13, color: C.lime, fontFamily: "Helvetica-Bold" },

  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 26,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: C.border,
    borderTopStyle: "solid",
    paddingTop: 9,
  },
  footerBrand: { fontSize: 8, color: C.muted },
  footerHash:  { fontSize: 7, color: C.subtle, fontFamily: "Helvetica-Oblique" },
});

type InvoiceLineItem = {
  description?: string;
  quantity?: number;
  qty?: number;
  unitPrice?: number;
  unit_price?: number;
};

type InvoiceForPdf = {
  id: string;
  supplier?: string;
  supplier_name?: string;
  supplierAddress?: string;
  supplier_address?: string;
  debtor?: string;
  debtor_name?: string;
  debtorEmail?: string;
  debtor_email?: string;
  amount?: number;
  currency?: string;
  terms?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItem[];
  pdfHash?: string;
};

// ─── PDF Document ─────────────────────────────────────────────────────────────
function InvoicePDF({ invoice }: { invoice: InvoiceForPdf }) {
  const formattedDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const lineItems: InvoiceLineItem[] = invoice.lineItems ?? [];
  const total = lineItems.length
    ? lineItems.reduce((sum: number, li: InvoiceLineItem) => {
        const qty   = Number(li.quantity ?? li.qty ?? 1);
        const price = Number(li.unitPrice ?? li.unit_price ?? 0);
        return sum + qty * price;
      }, 0)
    : Number(invoice.amount ?? 0);

  const fmtAmount = total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency  = invoice.currency ?? "USDC";

  return (
    <Document title={`Invoice ${invoice.id}`} author="New Way" subject="Private Invoice Factoring">
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerBand}>
          <View>
            <View style={s.logoMark}>
              <Text style={s.logoNew}>new</Text>
              <Text style={s.logoWay}>way</Text>
            </View>
            <Text style={s.logoSub}>Private Invoice Factoring</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceLabel}>Invoice</Text>
            <Text style={s.invoiceId}>{invoice.id}</Text>
            <View style={s.statusBadge}>
              <Text style={s.statusText}>Pending Approval</Text>
            </View>
          </View>
        </View>
        <View style={s.accentRule} />

        {/* ── Amount hero ── */}
        <View style={s.amountSection}>
          <Text style={s.amountLabel}>Invoice Amount</Text>
          <Text style={s.amountValue}>${fmtAmount}</Text>
          <Text style={s.amountCurrency}>{currency}</Text>
        </View>

        {/* ── Parties ── */}
        <View style={s.partiesRow}>
          <View style={s.partyCard}>
            <Text style={s.partyRole}>From · Supplier</Text>
            <Text style={s.partyName}>{invoice.supplier ?? invoice.supplier_name ?? "—"}</Text>
            <Text style={s.partyDetail}>{invoice.supplierAddress ?? invoice.supplier_address ?? ""}</Text>
          </View>
          <View style={[s.partyCard, s.partyCardTo]}>
            <Text style={[s.partyRole, s.partyRoleTo]}>To · Debtor</Text>
            <Text style={s.partyName}>{invoice.debtor ?? invoice.debtor_name ?? "—"}</Text>
            <Text style={s.partyDetail}>{invoice.debtorEmail ?? invoice.debtor_email ?? ""}</Text>
          </View>
        </View>

        {/* ── Details strip ── */}
        <View style={s.detailsStrip}>
          <View style={[s.detailCell, s.detailCellFirst]}>
            <Text style={s.detailLabel}>Payment Terms</Text>
            <Text style={s.detailValue}>{invoice.terms ?? "—"}</Text>
          </View>
          <View style={[s.detailCell, s.detailCellMid]}>
            <Text style={s.detailLabel}>Due Date</Text>
            <Text style={s.detailValue}>{formattedDate}</Text>
          </View>
          <View style={[s.detailCell, s.detailCellLast]}>
            <Text style={s.detailLabel}>Currency</Text>
            <Text style={s.detailValue}>{currency}</Text>
          </View>
        </View>

        {/* ── Line items ── */}
        {lineItems.length > 0 && (
          <View style={s.tableWrap}>
            <View style={s.tableHead}>
              <Text style={[s.thText, s.colDesc]}>Description</Text>
              <Text style={[s.thText, s.colQty]}>Qty</Text>
              <Text style={[s.thText, s.colPrice]}>Unit Price</Text>
              <Text style={[s.thText, s.colTotal]}>Total</Text>
            </View>
            {lineItems.map((li: InvoiceLineItem, i: number) => {
              const qty   = Number(li.quantity ?? li.qty ?? 1);
              const price = Number(li.unitPrice ?? li.unit_price ?? 0);
              return (
                <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tdText,  s.colDesc]}>{li.description}</Text>
                  <Text style={[s.tdMono,  s.colQty]}>{qty}</Text>
                  <Text style={[s.tdMono,  s.colPrice]}>${price.toLocaleString()}</Text>
                  <Text style={[s.tdText,  s.colTotal]}>${(qty * price).toLocaleString()}</Text>
                </View>
              );
            })}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalValue}>${total.toLocaleString()} {currency}</Text>
            </View>
          </View>
        )}

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>Generated — Private Invoice Factoring</Text>
          <Text style={s.footerHash}>PDF Hash: {invoice.pdfHash ?? "pending"}</Text>
        </View>
      </Page>
    </Document>
  );
}

// ─── Route Handler ────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId") ?? "INV-001";

  let invoice: InvoiceForPdf | null = null;
  try {
    const { data } = await supabase.from("invoices").select("*").eq("id", invoiceId).single();
    if (data) {
      invoice = {
        id:              data.id,
        supplier:        data.supplier_name,
        supplierAddress: data.supplier_address ?? "",
        debtor:          data.debtor_name,
        debtorEmail:     data.debtor_email ?? "",
        amount:          data.face_value,
        currency:        data.currency ?? "USDC",
        terms:           data.terms,
        dueDate:         data.due_date,
        lineItems:       data.line_items ?? [],
        pdfHash:         data.pdf_hash,
      };
    }
  } catch { /* db error */ }

  if (!invoice) {
    return NextResponse.json(
      { error: `Invoice ${invoiceId} not found` },
      { status: 404 }
    );
  }

  const approveApiUrl = `${request.nextUrl.origin}/api/approve`;
  const reactPdfBuffer = await renderToBuffer(<InvoicePDF invoice={invoice} />);

  // ── Post-process: interactive CTA ──────────────────────────────────────────
  const pdfDoc = await PDFDocument.load(reactPdfBuffer);
  const helv   = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helvB  = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const form   = pdfDoc.getForm();
  const page   = pdfDoc.getPages()[0];
  const { width } = page.getSize();

  // ── Colours (in-theme: white/lime/ink only) ──
  const lime     = rgb(0.64, 0.90, 0.21);  // #a3e635
  const limeDark = rgb(0.40, 0.64, 0.05);  // #65a30d
  const limeBg   = rgb(0.97, 0.99, 0.91);  // #f7fee7
  const ink      = rgb(0.07, 0.09, 0.15);  // #111827
  const inkMid   = rgb(0.22, 0.26, 0.31);  // #374151
  const muted    = rgb(0.42, 0.45, 0.50);  // #6b7280
  const surface  = rgb(0.98, 0.98, 0.98);  // #f9fafb
  const border   = rgb(0.90, 0.91, 0.92);  // #e5e7eb
  const white    = rgb(1.00, 1.00, 1.00);

  // ── Layout ──
  const M  = 44;
  const CW = width - M * 2;   // 507 pt
  const G  = 8;

  const SB_H  = 22;   // status bar height
  const BH1   = 28;   // SEND/CHECK row height
  const BH2   = 28;   // OTP/VERIFY row height
  const BH3   = 32;   // APPROVE row height (slightly taller = primary CTA)
  const SR    = 8;    // step circle radius

  // Stack rows bottom → top
  const SB_Y    = 60;
  const ROW3_Y  = SB_Y  + SB_H  + G;          // APPROVE    = 90
  const ROW2_Y  = ROW3_Y + BH3  + G;          // VERIFY     = 130
  const ROW1_Y  = ROW2_Y + BH2  + G;          // SEND/CHECK = 166
  const STEP_LY = ROW1_Y + BH1  + 9;          // step labels = 203
  const STEP_CY = STEP_LY + 9   + 5 + SR;     // circle ctr  = 225
  const SUB2_Y  = STEP_CY + SR  + 10;         // subtitle 2  = 243
  const SUB1_Y  = SUB2_Y  + 13;               // subtitle 1  = 256
  const TTL_Y   = SUB1_Y  + 16;               // title       = 272
  const BOX_Y   = SB_Y - 4;                   // panel start = 56
  const BOX_H   = TTL_Y + 20 + 8 - BOX_Y;    // panel height = 244

  // Column splits
  const R1W   = Math.round((CW - G) / 2);    // SEND/CHECK halves  ≈ 249
  const OTP_W = Math.round(CW * 0.57);       // OTP input width    ≈ 289
  const VFY_X = M + OTP_W + G;
  const VFY_W = CW - OTP_W - G;             // VERIFY width       ≈ 210

  // Step circle positions
  const C1X = M + Math.round(CW / 6);
  const C2X = M + Math.round(CW / 2);
  const C3X = M + Math.round((5 * CW) / 6);

  // ── Draw: panel background (white card with lime top border) ──
  page.drawRectangle({ x: M, y: BOX_Y, width: CW, height: BOX_H,
    color: white, borderColor: border, borderWidth: 1 });
  // Lime top accent
  page.drawRectangle({ x: M, y: BOX_Y + BOX_H - 3, width: CW, height: 3, color: lime });

  // ── Draw: title & subtitles ──
  page.drawText("Debtor Authorisation", {
    x: M + 16, y: TTL_Y, size: 14, font: helvB, color: ink });
  page.drawText("Step 1: click SEND OTP — a one-time code will be emailed to the debtor address on this invoice.", {
    x: M + 16, y: SUB1_Y, size: 8, font: helv, color: muted });
  page.drawText("Step 2: enter the code in the OTP field and click VERIFY.  Step 3: click APPROVE.", {
    x: M + 16, y: SUB2_Y, size: 8, font: helv, color: muted });

  // ── Draw: step indicators ──
  // connector lines
  page.drawLine({ start: { x: C1X + SR + 3, y: STEP_CY }, end: { x: C2X - SR - 3, y: STEP_CY }, thickness: 1, color: border });
  page.drawLine({ start: { x: C2X + SR + 3, y: STEP_CY }, end: { x: C3X - SR - 3, y: STEP_CY }, thickness: 1, color: border });

  const steps = [
    { x: C1X, num: "1", label: "SEND OTP",  active: true },
    { x: C2X, num: "2", label: "VERIFY",    active: false },
    { x: C3X, num: "3", label: "APPROVE",   active: false },
  ];
  for (const { x, num, label, active } of steps) {
    page.drawEllipse({ x, y: STEP_CY, xScale: SR, yScale: SR,
      color: active ? limeBg : surface,
      borderColor: active ? lime : border, borderWidth: active ? 1.5 : 1 });
    const nw = helvB.widthOfTextAtSize(num, 7.5);
    page.drawText(num, { x: x - nw / 2, y: STEP_CY - 3.5, size: 7.5, font: helvB,
      color: active ? limeDark : muted });
    const lw = helv.widthOfTextAtSize(label, 6.5);
    page.drawText(label, { x: x - lw / 2, y: STEP_LY, size: 6.5, font: helv,
      color: active ? limeDark : muted });
  }

  // ── Draw: row backgrounds ──
  // Row 1: SEND OTP (lime) | CHECK STATUS (white/bordered)
  page.drawRectangle({ x: M,       y: ROW1_Y, width: R1W,  height: BH1, color: limeBg,  borderColor: lime,   borderWidth: 1 });
  page.drawRectangle({ x: M+R1W+G, y: ROW1_Y, width: R1W,  height: BH1, color: surface, borderColor: border, borderWidth: 1 });

  // Row 2: OTP input (white) | VERIFY (lime)
  page.drawText("OTP CODE", { x: M + 4, y: ROW2_Y + BH2 + 3, size: 6.5, font: helvB, color: muted });
  page.drawRectangle({ x: M,      y: ROW2_Y, width: OTP_W, height: BH2, color: white,  borderColor: border, borderWidth: 1 });
  page.drawRectangle({ x: VFY_X,  y: ROW2_Y, width: VFY_W, height: BH2, color: limeBg, borderColor: lime,   borderWidth: 1 });

  // Row 3: APPROVE full-width (lime, slightly taller)
  page.drawRectangle({ x: M, y: ROW3_Y, width: CW, height: BH3, color: lime, borderColor: limeDark, borderWidth: 1.5 });

  // Status bar: ink background, full-width
  page.drawRectangle({ x: M, y: SB_Y, width: CW, height: SB_H, color: ink, borderColor: ink, borderWidth: 0 });
  page.drawEllipse({ x: M + 10, y: SB_Y + SB_H / 2, xScale: 2.5, yScale: 2.5, color: lime });

  // ── Hidden data fields ──
  const hidden = (name: string, value: string) => {
    const f = form.createTextField(name);
    f.setText(value);
    f.enableReadOnly();
    f.addToPage(page, { x: 0, y: 0, width: 1, height: 1 });
  };
  hidden("invoiceId",   invoice.id);
  hidden("debtorEmail", invoice.debtorEmail ?? "");

  // ── OTP code input ──
  const otpField = form.createTextField("otpCode");
  otpField.setText("");
  otpField.addToPage(page, {
    x: M + 6, y: ROW2_Y + 5, width: OTP_W - 12, height: BH2 - 10,
    font: helv, textColor: ink, backgroundColor: white, borderWidth: 0,
  });
  otpField.setFontSize(11);

  // ── SEND OTP ──
  const btnSend = form.createTextField("btnSendOtp");
  btnSend.setText("Send OTP");
  btnSend.enableReadOnly();
  btnSend.setAlignment(TextAlignment.Center);
  btnSend.addToPage(page, {
    x: M + 4, y: ROW1_Y + 4, width: R1W - 8, height: BH1 - 8,
    font: helvB, textColor: limeDark, backgroundColor: limeBg, borderWidth: 0,
  });
  btnSend.setFontSize(9);

  // ── CHECK STATUS ──
  const btnCheck = form.createTextField("btnCheckStatus");
  btnCheck.setText("Check Status");
  btnCheck.enableReadOnly();
  btnCheck.setAlignment(TextAlignment.Center);
  btnCheck.addToPage(page, {
    x: M + R1W + G + 4, y: ROW1_Y + 4, width: R1W - 8, height: BH1 - 8,
    font: helvB, textColor: inkMid, backgroundColor: surface, borderWidth: 0,
  });
  btnCheck.setFontSize(9);

  // ── VERIFY & AUTHORISE ──
  const btnVerify = form.createTextField("btnVerify");
  btnVerify.setText("Verify & Authorise");
  btnVerify.enableReadOnly();
  btnVerify.setAlignment(TextAlignment.Center);
  btnVerify.addToPage(page, {
    x: VFY_X + 4, y: ROW2_Y + 4, width: VFY_W - 8, height: BH2 - 8,
    font: helvB, textColor: limeDark, backgroundColor: limeBg, borderWidth: 0,
  });
  btnVerify.setFontSize(9);


  const btnApprove = form.createTextField("btnApprove");

  btnApprove.enableReadOnly();
  btnApprove.setAlignment(TextAlignment.Center);
  btnApprove.addToPage(page, {
    x: M + 4, y: ROW3_Y + 4, width: CW - 8, height: BH3 - 8,
    font: helvB, textColor: ink, backgroundColor: lime, borderWidth: 0,
  });
  btnApprove.setFontSize(10);

  // ── Status field ──
  const statusField = form.createTextField("status");
  statusField.setText("Ready — click Send OTP to begin.");
  statusField.enableReadOnly();
  statusField.addToPage(page, {
    x: M + 18, y: SB_Y + 4, width: CW - 26, height: SB_H - 8,
    font: helv, textColor: lime, backgroundColor: ink, borderWidth: 0,
  });
  statusField.setFontSize(9);

  // ── Document JavaScript ──
  const O = request.nextUrl.origin;
  const js = `
function doSendOtp() {
  var sf = this.getField("status");
  if (sf) sf.value = "Sending OTP to debtor email...";
  try {
    this.submitForm({ cURL: "${O}/api/pdf-auth/request-otp", cSubmitAs: "HTML", cCharset: "utf-8" });
  } catch(e) { if (sf) sf.value = "Error: " + e.toString(); }
}

function doVerify() {
  var otp = this.getField("otpCode");
  if (!otp || !otp.value || otp.value.length < 4) {
    this.getField("status").value = "Please enter the OTP code from your email first.";
    return;
  }
  var sf = this.getField("status");
  if (sf) sf.value = "Verifying OTP... wait for confirmation, then click Approve.";
  try {
    this.submitForm({ cURL: "${O}/api/pdf-auth/verify-otp", cSubmitAs: "HTML", cCharset: "utf-8" });
  } catch(e) { if (sf) sf.value = "Error: " + e.toString(); }
}

function doApprove() {
  var sf = this.getField("status");
  if (sf) sf.value = "Submitting approval... check dashboard for confirmation.";
  try {
    this.submitForm({ cURL: "${approveApiUrl}", cSubmitAs: "HTML", cCharset: "utf-8" });
  } catch(e) { if (sf) sf.value = "Error: " + e.toString(); }
}

function doCheckStatus() {
  var sf = this.getField("status");
  if (sf) sf.value = "Checking approval status...";
  try {
    this.submitForm({ cURL: "${O}/api/invoice-status", cSubmitAs: "HTML", cCharset: "utf-8" });
  } catch(e) { if (sf) sf.value = "Error: " + e.toString(); }
}

this.getField("btnSendOtp").setAction("OnFocus",     "doSendOtp();");
this.getField("btnCheckStatus").setAction("OnFocus", "doCheckStatus();");
this.getField("btnVerify").setAction("OnFocus",      "doVerify();");
this.getField("btnApprove").setAction("OnFocus",     "doApprove();");
`;
  pdfDoc.addJavaScript("invoice-generator", js);

  const finalBuffer = await pdfDoc.save();
  return new NextResponse(new Uint8Array(finalBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${invoice.id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

import { NextResponse } from "next/server";

// Seed route disabled — old Flare contracts removed.
// Use /api/invoices POST + /api/approve POST + /api/agent/attest POST to seed data.
export async function POST() {
  return NextResponse.json({
    error: "Seed route disabled in Flare+Hedera migration. Create invoices via /api/invoices instead.",
  }, { status: 410 });
}

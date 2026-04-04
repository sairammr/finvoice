-- Hedsup: Supabase schema for invoice factoring platform
-- Migrated to Flare TEE + Hedera HTS architecture
-- Run this in the Supabase SQL Editor to set up the database.

create table if not exists invoices (
  id              text primary key,                     -- e.g. "INV-M1K2X3"
  token_id        integer,                              -- legacy field (unused in new architecture)
  supplier_name   text not null,
  supplier_address text,                                -- wallet / on-chain address
  debtor_name     text not null,
  debtor_email    text,
  face_value      numeric not null,                     -- invoice amount (USDC, human-readable)
  currency        text not null default 'USDC',
  terms           text not null,                        -- e.g. "net-30"
  due_date        date not null,
  line_items      jsonb default '[]'::jsonb,            -- array of { description, quantity, unitPrice }
  jurisdiction    text default 'Brazil',
  payment_history text default 'Good payment history, no defaults',
  status          text not null default 'draft',        -- draft | pending_approval | approved | scoring | listed | funded | settled
  pdf_hash        text,                                 -- keccak256 hash of generated PDF
  tx_hash         text,                                 -- legacy field
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),

  -- Flare TEE fields
  flare_tx_hash   text,                                 -- Flare Coston2 instruction tx hash

  -- Hedera HTS fields
  hedera_attestation_serial bigint,                     -- Attestation NFT serial number
  hedera_receipt_serial     bigint,                     -- Receipt NFT serial number
  funder_hedera_id          text,                       -- Funder's Hedera account ID
  funded_at                 timestamptz,
  purchase_price            numeric,                    -- Discounted price funder paid

  -- Scoring fields (denormalized from Hedera NFT metadata)
  risk_grade        text,                               -- A | B | C | D
  yield_bps         integer,                            -- Annualized yield in basis points
  discount_bps      integer,                            -- Discount in basis points
  confidence_score  integer                             -- AI confidence 0-100
);

-- Indexes for common queries
create index if not exists idx_invoices_status on invoices (status);
create index if not exists idx_invoices_created_at on invoices (created_at desc);

-- Row Level Security (open for hackathon MVP — restrict in production)
alter table invoices enable row level security;

create policy "Allow all operations for hackathon" on invoices
  for all
  using (true)
  with check (true);

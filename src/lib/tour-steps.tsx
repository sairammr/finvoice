import type { Tour } from "nextstepjs";
import {
  Brain,
  FileText,
  Hand,
  LayoutDashboard,
  Lock,
  SlidersHorizontal,
  Store,
  TrendingUp,
} from "lucide-react";

const iconClass = "size-5 shrink-0 text-primary";

export const tours: Tour[] = [
  {
    tour: "main-tour",
    steps: [
      /* ── 1. Welcome ── */
      {
        icon: <Hand className={iconClass} aria-hidden />,
        title: "Welcome to Finvoice",
        content:
          "Private invoice factoring on Flare. Suppliers create invoices and borrow against them for instant liquidity — funders earn fixed yield on real-world receivables. Let's walk through it.",
        side: "bottom",
        showControls: true,
        showSkip: true,
        nextRoute: "/create-invoice",
      },

      /* ── 2. Borrow – nav link (now on /create-invoice) ── */
      {
        icon: <FileText className={iconClass} aria-hidden />,
        title: "Borrow Against Invoices",
        content:
          "Create an invoice for your debtor with line items — the total is calculated automatically. Once the debtor approves via a one-time PDF link, the invoice is tokenized on Flare and you receive liquidity upfront.",
        selector: '[data-tour="create-invoice"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
        nextRoute: "/marketplace",
      },

      /* ── 3. Earn – nav link (now on /marketplace) ── */
      {
        icon: <Store className={iconClass} aria-hidden />,
        title: "Earn Marketplace",
        content:
          'Browse tokenized invoices ready to fund. Each listing shows face value, supply APY, tenure, and an AI risk grade (A\u2013D). Click the "See AI Analysis" button on any row for a detailed scoring breakdown.',
        selector: '[data-tour="marketplace"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
      },

      /* ── 4. Market stats (on /marketplace) ── */
      {
        icon: <TrendingUp className={iconClass} aria-hidden />,
        title: "Live Market Stats",
        content:
          "At a glance: total market size, funds still available, the best available APY right now, and the average AI confidence score across all invoices.",
        selector: '[data-tour="marketplace-stats"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
      },

      /* ── 5. Filters (on /marketplace) ── */
      {
        icon: <SlidersHorizontal className={iconClass} aria-hidden />,
        title: "Filter & Sort",
        content:
          "Narrow by risk grade (A to D), hide already-funded invoices to focus on open opportunities, and sort by yield, face value, tenure, or risk grade.",
        selector: '[data-tour="marketplace-filters"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
        nextRoute: "/dashboard",
      },

      /* ── 6. Dashboard – nav link (now on /dashboard) ── */
      {
        icon: <LayoutDashboard className={iconClass} aria-hidden />,
        title: "Your Dashboard",
        content:
          'Track everything in one place. Switch between Supplier View \u2014 invoice statuses from "Pending Approval" through to "Settled" \u2014 and Funder View to monitor positions you\'ve funded.',
        selector: '[data-tour="dashboard"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
      },

      /* ── 7. Dashboard tabs (on /dashboard) ── */
      {
        icon: <Brain className={iconClass} aria-hidden />,
        title: "Supplier & Funder Views",
        content:
          "The Supplier tab shows all invoices you've created and their on-chain status. The Funder tab shows invoices you've funded, purchase prices, and expected returns at maturity.",
        selector: '[data-tour="dashboard-tabs"]',
        side: "bottom",
        showControls: true,
        showSkip: true,
      },

      /* ── 8. Privacy closing (no selector) ── */
      {
        icon: <Lock className={iconClass} aria-hidden />,
        title: "Privacy by Design",
        content:
          "Debtor identities and invoice details stay on the Privacy Node — only risk grades and yield rates are published on-chain. Every attestation hash is verifiable on the Flare Coston2 explorer. You're ready to go!",
        side: "bottom",
        showControls: true,
        showSkip: false,
      },
    ],
  },
];

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNextStep } from "nextstepjs";
import {
  FileText,
  Store,
  LayoutDashboard,
  ChevronDown,
  UserCircle,
  Wallet,
  LogOut,
  HelpCircle,
  ExternalLink,
  Coins,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRole, type Role } from "@/components/providers";
import { motion } from "framer-motion";

const FLARE_COSTON2_CHAIN_ID = 114;

const navLinks = [
  {
    href: "/create-invoice",
    label: "Borrow",
    icon: FileText,
    tourId: "create-invoice",
  },
  { href: "/marketplace", label: "Earn", icon: Store, tourId: "marketplace" },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    tourId: "dashboard",
  },
];

const roleLabels: Record<Role, string> = {
  supplier: "Supplier",
  debtor: "Debtor",
  funder: "Funder",
};

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatBalance(raw: string): string {
  const val = parseFloat(raw);
  if (val === 0) return "0.00";
  if (val < 0.01) return "<0.01";
  if (val < 1) return val.toFixed(4);
  return val.toFixed(2);
}

export function Navbar() {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { startNextStep } = useNextStep();

  const walletAddress = user?.wallet?.address;

  const [balanceFormatted, setBalanceFormatted] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundStatus, setFundStatus] = useState<
    "idle" | "signing" | "claiming" | "success" | "error"
  >("idle");
  const [fundError, setFundError] = useState<string | null>(null);

  // Switch wallet to Flare Testnet Coston2 on connect
  useEffect(() => {
    if (!authenticated || wallets.length === 0) return;

    async function switchChain() {
      const wallet = wallets[0];
      if (!wallet) return;

      try {
        await wallet.switchChain(FLARE_COSTON2_CHAIN_ID);
      } catch {
        try {
          const provider = await wallet.getEthereumProvider();
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${FLARE_COSTON2_CHAIN_ID.toString(16)}`,
                chainName: "Flare Testnet Coston2",
                nativeCurrency: { name: "USDr", symbol: "USDr", decimals: 18 },
                rpcUrls: ["https://coston2-api.flare.network/ext/C/rpc"],
                blockExplorerUrls: ["https://coston2-explorer.flare.network"],
              },
            ],
          });
        } catch (addErr) {
          console.error("Failed to add Flare chain:", addErr);
        }
      }
    }

    switchChain();
  }, [authenticated, wallets]);

  // Fetch USDr balance via server-side API route
  const fetchBalance = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`/api/balance?address=${walletAddress}`);
      if (res.ok) {
        const data = await res.json();
        setBalanceFormatted(data.formatted);
      }
    } catch {
      setBalanceFormatted(null);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (!walletAddress) {
      setBalanceFormatted(null);
      return;
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [walletAddress, fetchBalance]);

  // Fund wallet: SIWE auth with faucet + claim
  const handleFundWallet = useCallback(async () => {
    const wallet = wallets[0];
    if (!wallet || !walletAddress || isFunding) return;

    setIsFunding(true);
    setFundStatus("idle");
    setFundError(null);

    try {
      // Step 1: Prepare — get SIWE message from our API
      const prepRes = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "prepare", address: walletAddress }),
      });
      const prepData = await prepRes.json();
      if (!prepRes.ok) throw new Error(prepData.error || "Failed to prepare");

      const { message, session } = prepData;

      // Step 2: Sign the SIWE message with the connected wallet
      setFundStatus("signing");
      const provider = await wallet.getEthereumProvider();
      const signature = await provider.request({
        method: "personal_sign",
        params: [message, walletAddress],
      });

      // Step 3: Claim — verify signature + request faucet funds
      setFundStatus("claiming");
      const claimRes = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "claim", message, signature, session }),
      });
      const claimData = await claimRes.json();
      if (!claimRes.ok)
        throw new Error(claimData.error || "Faucet claim failed");

      setFundStatus("success");
      // Refresh balance after funds arrive (~5s)
      setTimeout(fetchBalance, 5000);
      setTimeout(fetchBalance, 10000);
      setTimeout(() => setFundStatus("idle"), 8000);
    } catch (err) {
      console.error("Fund wallet error:", err);
      setFundStatus("error");
      setFundError(err instanceof Error ? err.message : "Something went wrong");
      setTimeout(() => {
        setFundStatus("idle");
        setFundError(null);
      }, 5000);
    } finally {
      setIsFunding(false);
    }
  }, [wallets, walletAddress, isFunding, fetchBalance]);

  const isZeroBalance =
    balanceFormatted !== null && parseFloat(balanceFormatted) === 0;
  const balanceDisplay =
    balanceFormatted !== null ? formatBalance(balanceFormatted) : null;

  const fundButtonLabel = (() => {
    switch (fundStatus) {
      case "signing":
        return "Sign message...";
      case "claiming":
        return "Claiming...";
      case "success":
        return "Funded!";
      case "error":
        return fundError || "Failed";
      default:
        return "Fund Wallet";
    }
  })();

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-lime-200/60 bg-white/80 backdrop-blur-md overflow-hidden"
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Logo />

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon, tourId }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                data-tour={tourId}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-lime-50 text-lime-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="size-5" />
                <span className="hidden sm:inline">{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-lime-400"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side: Tour + Role + Auth */}
        <div className="flex items-center gap-2">
          {/* Tour button */}
          <button
            onClick={() => startNextStep("main-tour")}
            className="flex items-center justify-center rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-lime-50 hover:text-lime-600"
            title="Start tour"
          >
            <HelpCircle className="size-4" />
          </button>
          {/* Wallet / Auth */}
          {ready && authenticated && walletAddress ? (
            <div className="flex items-center gap-1.5">
              {/* Fund Wallet button — visible when zero balance */}
              {isZeroBalance && (
                <button
                  onClick={handleFundWallet}
                  disabled={isFunding}
                  className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    fundStatus === "success"
                      ? "border-green-300 bg-green-50 text-green-700"
                      : fundStatus === "error"
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {isFunding ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : fundStatus === "success" ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Coins className="size-3.5" />
                  )}
                  <span className="hidden sm:inline">{fundButtonLabel}</span>
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg border border-lime-300 bg-lime-50 px-3 py-1.5 text-sm font-medium text-lime-800 transition-colors hover:bg-lime-100 focus:outline-none">
                  <Wallet className="size-4" />
                  <span className="font-mono text-xs">
                    {truncateAddress(walletAddress)}
                  </span>
                  {balanceDisplay !== null && (
                    <>
                      <span className="text-lime-300">·</span>
                      <span
                        className={`text-xs ${
                          isZeroBalance
                            ? "font-semibold text-red-500"
                            : "text-lime-600"
                        }`}
                      >
                        {balanceDisplay} USDr
                      </span>
                    </>
                  )}
                  {isLoadingBalance && balanceDisplay === null && (
                    <>
                      <span className="text-lime-300">·</span>
                      <span className="animate-pulse text-xs text-gray-400">
                        ...
                      </span>
                    </>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={6}
                  className="w-64"
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="break-all font-mono text-xs leading-relaxed">
                      {walletAddress}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Balance detail */}
                    <div className="px-2 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          USDr Balance
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isZeroBalance ? "text-red-500" : "text-gray-900"
                          }`}
                        >
                          {balanceDisplay !== null
                            ? `${balanceDisplay} USDr`
                            : "Loading..."}
                        </span>
                      </div>
                      {isZeroBalance && (
                        <p className="mt-1.5 text-[11px] leading-tight text-gray-500">
                          You need C2FLR to pay gas on Flare Coston2.
                        </p>
                      )}
                    </div>

                    {/* Fund Wallet CTA in dropdown */}
                    {isZeroBalance && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                          <button
                            onClick={handleFundWallet}
                            disabled={isFunding}
                            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-lime-400 px-3 py-2 text-sm font-medium text-lime-950 transition-colors hover:bg-lime-500 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isFunding ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : fundStatus === "success" ? (
                              <CheckCircle2 className="size-4" />
                            ) : (
                              <Coins className="size-4" />
                            )}
                            {fundButtonLabel}
                          </button>
                        </div>
                      </>
                    )}

                    {/* Faucet external link (always available) */}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        window.open("https://faucet.flare.network/coston2", "_blank")
                      }
                      className="flex items-center gap-2 text-xs text-gray-500"
                    >
                      <ExternalLink className="size-3.5" />
                      Open Flare Faucet
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-red-600"
                    >
                      <LogOut className="mr-2 size-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : ready ? (
            <Button
              onClick={() => login()}
              size="sm"
              className="gap-1.5 bg-lime-400 text-lime-950 hover:bg-lime-500"
            >
              <Wallet className="size-4" />
              Connect
            </Button>
          ) : null}
        </div>
      </div>
    </motion.header>
  );
}

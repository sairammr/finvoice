"use client";

import React, { createContext, useContext, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { NextStepProvider, NextStep } from "nextstepjs";
import { TourCard } from "@/components/tour-card";
import { tours } from "@/lib/tour-steps";
import { defineChain } from "viem";

export type Role = "supplier" | "debtor" | "funder";

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}

// Hedera Testnet chain definition for Privy
const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  network: "hedera-testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL || "https://296.rpc.thirdweb.com"] },
  },
  blockExplorers: {
    default: {
      name: "HashScan",
      url: "https://hashscan.io/testnet",
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("supplier");

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#a3e635",
          logo: undefined,
          walletChainType: "ethereum-only",
        },
        loginMethods: ["wallet", "email", "google"],
        defaultChain: hederaTestnet,
        supportedChains: [hederaTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <RoleContext.Provider value={{ role, setRole }}>
        <NextStepProvider>
          <NextStep steps={tours} cardComponent={TourCard}>
            {children}
          </NextStep>
        </NextStepProvider>
      </RoleContext.Provider>
    </PrivyProvider>
  );
}

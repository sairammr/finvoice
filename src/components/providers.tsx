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

// Flare Coston2 Testnet chain definition for Privy
const flareCoston2 = defineChain({
  id: 114,
  name: "Flare Testnet Coston2",
  network: "coston2",
  nativeCurrency: { name: "Coston2 Flare", symbol: "C2FLR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://coston2-api.flare.network/ext/C/rpc"] },
  },
  blockExplorers: {
    default: {
      name: "Coston2 Explorer",
      url: "https://coston2-explorer.flare.network",
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
        defaultChain: flareCoston2,
        supportedChains: [flareCoston2],
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

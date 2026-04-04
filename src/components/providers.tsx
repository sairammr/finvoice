"use client";

import React, { createContext, useContext, useState } from "react";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { NextStepProvider, NextStep } from "nextstepjs";
import { TourCard } from "@/components/tour-card";
import { tours } from "@/lib/tour-steps";

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

// Hedera Testnet network definition for Dynamic
const hederaTestnetNetwork = {
  blockExplorerUrls: ["https://hashscan.io/testnet"],
  chainId: 296,
  chainName: "Hedera Testnet",
  iconUrls: [],
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  networkId: 296,
  rpcUrls: [process.env.NEXT_PUBLIC_HEDERA_RPC_URL ?? "https://296.rpc.thirdweb.com"],
  vanityName: "Hedera Testnet",
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("supplier");

  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID || "",
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [hederaTestnetNetwork],
        },
        events: {
          onAuthSuccess: () => {
            console.log("[Dynamic] Auth success");
          },
          onLogout: () => {
            console.log("[Dynamic] Logged out");
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
    </DynamicContextProvider>
  );
}

import type { ReactNode } from "react";
import type { NetworkId } from "@orderly.network/types";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletConnectorProvider } from "@orderly.network/wallet-connector";
import {
  Network,
  WalletConnectorPrivyProvider,
} from "@orderly.network/wallet-connector-privy";
import { QueryClient } from "@tanstack/query-core";
import { getRuntimeConfig, getRuntimeConfigBoolean } from "./runtime-config";
import {
  getEvmConnectors,
  getEvmInitialConfig,
  getSolanaConfig,
  getSolanaWallets,
} from "./wallet-config";

type LoginMethod = "email" | "passkey" | "twitter" | "google";

const queryClient = new QueryClient();

function getLoginMethods(): LoginMethod[] {
  const value = getRuntimeConfig("VITE_PRIVY_LOGIN_METHODS");
  const valid: LoginMethod[] = ["email", "passkey", "twitter", "google"];
  if (!value) return ["email"];
  return value
    .split(",")
    .map((method) => method.trim())
    .filter((method): method is LoginMethod => valid.includes(method as LoginMethod));
}

export function AppWalletProvider({
  children,
  networkId,
}: {
  children: ReactNode;
  networkId: NetworkId;
}) {
  const privyAppId = getRuntimeConfig("VITE_PRIVY_APP_ID");
  const disableEvm = getRuntimeConfigBoolean("VITE_DISABLE_EVM_WALLETS");
  const disableSolana = getRuntimeConfigBoolean("VITE_DISABLE_SOLANA_WALLETS");

  if (privyAppId) {
    return (
      <WalletConnectorPrivyProvider
        network={networkId === "mainnet" ? Network.mainnet : Network.testnet}
        termsOfUse={getRuntimeConfig("VITE_PRIVY_TERMS_OF_USE")}
        wagmiConfig={disableEvm ? undefined : { connectors: getEvmConnectors() }}
        solanaConfig={disableSolana ? undefined : getSolanaConfig(networkId)}
        privyConfig={{
          config: {
            appearance: { showWalletLoginFirst: false },
            loginMethods: getLoginMethods(),
          },
          appid: privyAppId,
        }}
        abstractConfig={
          getRuntimeConfigBoolean("VITE_ENABLE_ABSTRACT_WALLET")
            ? { queryClient }
            : undefined
        }
      >
        {children}
      </WalletConnectorPrivyProvider>
    );
  }

  return (
    <WalletConnectorProvider
      evmInitial={disableEvm ? undefined : getEvmInitialConfig()}
      solanaInitial={
        disableSolana
          ? undefined
          : {
              network:
                networkId === "mainnet"
                  ? WalletAdapterNetwork.Mainnet
                  : WalletAdapterNetwork.Devnet,
              wallets: getSolanaWallets(networkId),
            }
      }
    >
      {children}
    </WalletConnectorProvider>
  );
}

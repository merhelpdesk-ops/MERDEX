import type { CreateConnectorFn } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import {
  type Adapter,
  type WalletError,
  WalletAdapterNetwork,
  WalletNotReadyError,
} from "@solana/wallet-adapter-base";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import {
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  SolanaMobileWalletAdapter,
} from "@solana-mobile/wallet-adapter-mobile";
import type { NetworkId } from "@orderly.network/types";
import injectedOnboard from "@web3-onboard/injected-wallets";
import walletConnectOnboard from "@web3-onboard/walletconnect";
import binanceWallet from "@binance/w3w-blocknative-connector";
import { getRuntimeConfig } from "./runtime-config";

export const getEvmConnectors = (): CreateConnectorFn[] => {
  const projectId = getRuntimeConfig("VITE_WALLETCONNECT_PROJECT_ID");
  const connectors: CreateConnectorFn[] = [injected()];

  if (projectId && typeof window !== "undefined") {
    connectors.push(
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: getRuntimeConfig("VITE_APP_NAME") || "Orderly App",
          description:
            getRuntimeConfig("VITE_APP_DESCRIPTION") || "Orderly Application",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.webp`],
        },
      }),
    );
  }

  return connectors;
};

export const getSolanaWallets = (networkId: NetworkId) => {
  if (typeof window === "undefined") return [];

  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new SolanaMobileWalletAdapter({
      addressSelector: createDefaultAddressSelector(),
      appIdentity: { uri: `${location.protocol}//${location.host}` },
      authorizationResultCache: createDefaultAuthorizationResultCache(),
      chain:
        networkId === "mainnet"
          ? WalletAdapterNetwork.Mainnet
          : WalletAdapterNetwork.Devnet,
      onWalletNotFound: (adapter: SolanaMobileWalletAdapter) => {
        console.log("-- mobile wallet adapter", adapter);
        return Promise.reject(new WalletNotReadyError("wallet not ready"));
      },
    }),
  ];
};

export const getSolanaConfig = (networkId: NetworkId) => ({
  wallets: getSolanaWallets(networkId),
  onError: (error: WalletError, adapter?: Adapter) => {
    console.log("-- error", error, adapter);
  },
});

export const getEvmInitialConfig = () => {
  const projectId = getRuntimeConfig("VITE_WALLETCONNECT_PROJECT_ID");
  if (!projectId || typeof window === "undefined") return undefined;

  return {
    options: {
      wallets: [
        injectedOnboard(),
        binanceWallet({ options: { lng: "en" } }),
        walletConnectOnboard({
          projectId,
          qrModalOptions: { themeMode: "dark" as const },
          dappUrl: window.location.origin,
        }),
      ],
      appMetadata: {
        name: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") || "MERDEX",
        description: getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") || "MERDEX",
      },
    },
  };
};

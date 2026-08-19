import { useCallback, useLayoutEffect, useRef } from "react";
import type { WidgetConfig } from "woofi-swap-widget-kit";
import { useWalletConnector } from "@orderly.network/hooks";
import { getRuntimeConfig } from "../utils/runtime-config";
import {
  createStableEip1193Provider,
  type StableEip1193Provider,
} from "../utils/stable-eip1193-provider";
import { ControlledWooFiSwapWidget } from "./ControlledWooFiSwapWidget";
import "../styles/woofi-widget.css";
import "woofi-swap-widget-kit/style.css";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: readonly unknown[];
  }) => Promise<unknown>;
};

const WOOFI_CONFIG: WidgetConfig = {
  enableLinea: false,
  enableMerlin: false,
  enableHyperevm: false,
  enableZksync: false,
  initialLineChartVisible: false,
};

export default function WooFiWidget() {
  const { wallet, setChain, connectedChain, connect } = useWalletConnector();
  const brokerAddress = getRuntimeConfig("VITE_BROKER_EOA_ADDRESS") || "";
  const stableProviderRef = useRef<StableEip1193Provider | null>(null);
  if (!stableProviderRef.current) {
    stableProviderRef.current = createStableEip1193Provider();
  }

  const walletAddress = wallet?.accounts?.[0]?.address;
  const providerSession = wallet?.provider
    ? `${wallet.label}:${walletAddress ?? "pending"}`
    : undefined;
  const providerContext = providerSession
    ? `${walletAddress ?? "pending"}:${connectedChain?.id ?? "pending"}`
    : undefined;
  const stableProvider = stableProviderRef.current;
  useLayoutEffect(() => {
    stableProvider.updateTarget(wallet?.provider, providerSession);
    stableProvider.updateContext(providerContext);
  }, [providerContext, providerSession, stableProvider, wallet?.provider]);
  const woofiProvider = wallet?.provider ? stableProvider.provider : undefined;

  const handleConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const handleChainSwitch = useCallback(
    (targetChain: { chainName: string; chainId?: string; key: string }) => {
      if (!targetChain.chainId) return;

      const chainId = Number(targetChain.chainId);
      if (!Number.isSafeInteger(chainId) || chainId <= 0) return;
      if (connectedChain?.id === chainId) return;

      const provider = woofiProvider as Partial<Eip1193Provider> | undefined;

      if (typeof provider?.request === "function") {
        void provider
          .request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${chainId.toString(16)}` }],
          })
          .catch((error) => {
            console.warn("Wallet chain switch failed:", error);
          });
        return;
      }

      void setChain({ chainId });
    },
    [connectedChain?.id, setChain, woofiProvider],
  );

  return (
    <ControlledWooFiSwapWidget
      evmProvider={woofiProvider}
      currentChain={connectedChain?.id}
      onConnectWallet={handleConnectWallet}
      onChainSwitch={handleChainSwitch}
      brokerAddress={brokerAddress}
      config={WOOFI_CONFIG}
    />
  );
}

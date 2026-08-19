import { useCallback, useRef } from "react";
import { WooFiSwapWidgetReact } from "woofi-swap-widget-kit/react";
import { useWalletConnector } from "@orderly.network/hooks";
import { getRuntimeConfig } from "../utils/runtime-config";
import {
  createStableEip1193Provider,
  type StableEip1193Provider,
} from "../utils/stable-eip1193-provider";
import "../styles/woofi-widget.css";
import "woofi-swap-widget-kit/style.css";

type Eip1193Provider = {
  request: (args: {
    method: string;
    params?: readonly unknown[];
  }) => Promise<unknown>;
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
  stableProvider.updateTarget(wallet?.provider, providerSession);
  stableProvider.updateContext(providerContext);
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
    <WooFiSwapWidgetReact
      evmProvider={woofiProvider}
      currentChain={connectedChain?.id}
      onConnectWallet={handleConnectWallet}
      onChainSwitch={handleChainSwitch}
      brokerAddress={brokerAddress}
      config={{
        enableLinea: false,
        enableMerlin: false,
        enableHyperevm: false,
        enableZksync: false,
        initialLineChartVisible: false,
      }}
    />
  );
}

import { useCallback } from "react";
import { useWalletConnector } from "@orderly.network/hooks";
import { WooFiSwapWidgetReact } from "woofi-swap-widget-kit/react";
import { getRuntimeConfig } from "./runtime-config";

import "woofi-swap-widget-kit/style.css";

export function SwapWidget() {
  const { wallet, setChain, connectedChain, connect } = useWalletConnector();

  const connectWallet = useCallback(() => {
    // Orderly wallet-connector 3.1.8 expects an options object and reads
    // chainId synchronously. Calling connect() without it prevents the modal
    // from opening. Default to Arbitrum when there is no active EVM chain yet.
    void connect({ chainId: connectedChain?.id ?? 42161 });
  }, [connect, connectedChain?.id]);

  const switchChain = useCallback(
    (chain: { chainName: string; chainId?: string; key: string }) => {
      if (chain.chainId) void setChain({ chainId: Number(chain.chainId) });
    },
    [setChain],
  );

  return (
    <WooFiSwapWidgetReact
      evmProvider={wallet?.provider}
      currentChain={connectedChain?.id}
      onConnectWallet={connectWallet}
      onChainSwitch={switchChain}
      brokerAddress={getRuntimeConfig("VITE_BROKER_EOA_ADDRESS") || ""}
      config={{
        enableLinea: false,
        enableMerlin: false,
        enableHyperevm: false,
        enableZksync: false,
      }}
    />
  );
}

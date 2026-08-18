import { useCallback } from "react";
import { WooFiSwapWidgetReact } from "woofi-swap-widget-kit/react";
import { useWalletConnector } from "@orderly.network/hooks";
import { getRuntimeConfig } from "../utils/runtime-config";
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

  const handleConnectWallet = useCallback(() => {
    connect();
  }, [connect]);

  const handleChainSwitch = useCallback(
    (targetChain: { chainName: string; chainId?: string; key: string }) => {
      if (!targetChain.chainId) return;

      const chainId = Number(targetChain.chainId);
      if (!Number.isSafeInteger(chainId) || chainId <= 0) return;
      if (connectedChain?.id === chainId) return;

      const provider = wallet?.provider as Partial<Eip1193Provider> | undefined;

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
    [connectedChain?.id, setChain, wallet?.provider],
  );

  return (
    <WooFiSwapWidgetReact
      evmProvider={wallet?.provider}
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

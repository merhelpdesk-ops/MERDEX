import { useCallback } from "react";
import { useStorageChain, useWalletConnector } from "@orderly.network/hooks";
import { useAppContext } from "@orderly.network/react-app";
import { WooFiSwapWidgetReact } from "woofi-swap-widget-kit/react";
import { SUPPORTED_CHAINS } from "woofi-swap-widget-kit";
import { getRuntimeConfig } from "./runtime-config";

import "woofi-swap-widget-kit/style.css";

export function SwapWidget() {
  const { wallet, connectedChain, connect } = useWalletConnector();
  const { setCurrentChainId } = useAppContext();
  const { setStorageChain } = useStorageChain();
  const brokerAddress = getRuntimeConfig("VITE_BROKER_EOA_ADDRESS") || "";

  const switchChain = useCallback(
    async (targetChain: { chainName: string; chainId?: string; key: string }) => {
      if (!targetChain.chainId) return;

      const chainId = Number(targetChain.chainId);
      const provider = wallet?.provider as
        | { request?: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
        | undefined;

      if (!provider?.request || !Number.isSafeInteger(chainId)) return;

      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        setStorageChain(chainId);
        setCurrentChainId(chainId);
      } catch (error) {
        console.error(`Failed to switch wallet to ${targetChain.chainName}`, error);
      }
    },
    [setCurrentChainId, setStorageChain, wallet?.provider],
  );

  const connectWallet = useCallback(
    (options?: { network: string }) => {
      if (wallet && options?.network) {
        const targetChain = (
          SUPPORTED_CHAINS as Array<{
            chainName: string;
            chainId?: string;
            key: string;
          }>
        ).find((chain) => chain.key === options.network);

        if (targetChain?.chainId) {
          switchChain(targetChain);
          return;
        }
      }

      void connect();
    },
    [connect, switchChain, wallet],
  );

  return (
    <WooFiSwapWidgetReact
      evmProvider={wallet?.provider}
      currentChain={connectedChain?.id}
      onConnectWallet={connectWallet}
      onChainSwitch={switchChain}
      brokerAddress={brokerAddress}
      config={{
        enableLinea: false,
        enableMerlin: false,
        enableHyperevm: false,
        enableZksync: false,
      }}
    />
  );
}

import { useEffect, useRef } from "react";
import {
  WooFiSwapWidget,
  type ChainInfo,
  type WidgetConfig,
  type WooFiSwapWidgetOptions,
} from "woofi-swap-widget-kit";

type ControlledWooFiSwapWidgetProps = {
  brokerAddress: string;
  config: WidgetConfig;
  currentChain?: WooFiSwapWidgetOptions["currentChain"];
  evmProvider?: unknown;
  onChainSwitch: (targetChain: ChainInfo) => void;
  onConnectWallet: () => void;
};

/**
 * WooFi's bundled React wrapper calls updateEvmProvider immediately after its
 * constructor already received the same provider. That starts two concurrent
 * Web3/auth initializations. This bridge skips the redundant first update.
 */
export function ControlledWooFiSwapWidget({
  brokerAddress,
  config,
  currentChain,
  evmProvider,
  onChainSwitch,
  onConnectWallet,
}: ControlledWooFiSwapWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<WooFiSwapWidget | null>(null);
  const lastProviderRef = useRef<unknown>(evmProvider);
  const lastChainRef =
    useRef<WooFiSwapWidgetOptions["currentChain"]>(currentChain);
  const callbacksRef = useRef({ onChainSwitch, onConnectWallet });
  callbacksRef.current = { onChainSwitch, onConnectWallet };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mountPoint = document.createElement("div");
    container.replaceChildren(mountPoint);
    lastProviderRef.current = evmProvider;
    lastChainRef.current = currentChain;

    const widget = new WooFiSwapWidget({
      brokerAddress,
      config,
      container: mountPoint,
      currentChain,
      evmProvider,
      onChainSwitch: (targetChain) =>
        callbacksRef.current.onChainSwitch(targetChain),
      onConnectWallet: () => callbacksRef.current.onConnectWallet(),
    });
    widgetRef.current = widget;

    return () => {
      widget.destroy();
      widgetRef.current = null;
      container.replaceChildren();
    };
    // The widget is deliberately created once; subsequent mutable inputs are
    // handled by the update effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (Object.is(lastProviderRef.current, evmProvider)) return;
    lastProviderRef.current = evmProvider;
    widgetRef.current?.updateEvmProvider(evmProvider);
  }, [evmProvider]);

  useEffect(() => {
    if (lastChainRef.current === currentChain || !currentChain) return;
    lastChainRef.current = currentChain;
    widgetRef.current?.updateCurrentChain(currentChain);
  }, [currentChain]);

  return <div ref={containerRef} />;
}

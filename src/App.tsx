import { type ReactNode, useCallback } from "react";
import { LocaleProvider } from "@orderly.network/i18n";
import { OrderlyAppProvider } from "@orderly.network/react-app";
import type { NetworkId } from "@orderly.network/types";
import { Scaffold } from "@orderly.network/ui-scaffold";
import { getRuntimeConfig, getRuntimeConfigBoolean } from "./runtime-config";
import { SwapWidget } from "./SwapWidget";
import { AppWalletProvider } from "./WalletProvider";

const NETWORK_ID_KEY = "orderly_network_id";

function getNetworkId(): NetworkId {
  if (typeof window === "undefined") return "mainnet";
  const disableMainnet = getRuntimeConfigBoolean("VITE_DISABLE_MAINNET");
  const disableTestnet = getRuntimeConfigBoolean("VITE_DISABLE_TESTNET");
  if (disableMainnet && !disableTestnet) return "testnet";
  if (disableTestnet && !disableMainnet) return "mainnet";
  return (localStorage.getItem(NETWORK_ID_KEY) as NetworkId) || "mainnet";
}

function parseChains(value?: string): Array<{ id: number }> | undefined {
  if (!value) return undefined;
  return value
    .split(",")
    .map((id) => ({ id: Number.parseInt(id.trim(), 10) }))
    .filter(({ id }) => !Number.isNaN(id));
}

function OrderlyProvider({ children }: { children: ReactNode }) {
  const networkId = getNetworkId();
  const mainnetChains = getRuntimeConfigBoolean("VITE_DISABLE_MAINNET")
    ? []
    : parseChains(getRuntimeConfig("VITE_ORDERLY_MAINNET_CHAINS"));
  const testnetChains = getRuntimeConfigBoolean("VITE_DISABLE_TESTNET")
    ? []
    : parseChains(getRuntimeConfig("VITE_ORDERLY_TESTNET_CHAINS"));
  const defaultChainId = Number.parseInt(
    getRuntimeConfig("VITE_DEFAULT_CHAIN") || "42161",
    10,
  );
  const chainFilter =
    mainnetChains || testnetChains
      ? { mainnet: mainnetChains, testnet: testnetChains }
      : undefined;

  const onChainChanged = useCallback(
    (_chainId: number, { isTestnet }: { isTestnet: boolean }) => {
      const nextNetworkId: NetworkId = isTestnet ? "testnet" : "mainnet";
      if (nextNetworkId !== getNetworkId()) {
        localStorage.setItem(NETWORK_ID_KEY, nextNetworkId);
        window.setTimeout(() => window.location.reload(), 100);
      }
    },
    [],
  );

  return (
    <LocaleProvider locale="en" onLanguageChanged={async () => undefined}>
      <AppWalletProvider networkId={networkId}>
        <OrderlyAppProvider
          brokerId={getRuntimeConfig("VITE_ORDERLY_BROKER_ID") || "otter_lee"}
          brokerName={getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") || "MERDEX"}
          networkId={networkId}
          onChainChanged={onChainChanged}
          defaultChain={{ mainnet: { id: defaultChainId } }}
          {...(chainFilter ? { chainFilter } : {})}
          appIcons={{
            main: { component: <span className="mer-scaffold-logo">MERDEX</span> },
          }}
        >
          {children}
        </OrderlyAppProvider>
      </AppWalletProvider>
    </LocaleProvider>
  );
}

export default function App() {
  const perpsUrl = getRuntimeConfig("VITE_PERPS_REDIRECT_URL") || "https://google.com";

  return (
    <OrderlyProvider>
      <Scaffold
        mainNavProps={{
          customRender: ({ chainMenu, walletConnect }) => (
            <div className="mer-header-actions">
              {chainMenu}
              {walletConnect}
            </div>
          ),
        }}
        footer={<></>}
        classNames={{
          root: "mer-orderly-scaffold",
          content: "mer-orderly-content",
        }}
      >
        <main className="mer-swap-content">
          <section className="mer-hero">
            <h1>MERDEX</h1>
            <p>MERDEX is a secure and high-speed aggregate platform.</p>
          </section>

          <section className="mer-trade-card">
            <nav className="mer-product-tabs" aria-label="Trading products">
              <span className="mer-product-tab is-active" aria-current="page">
                Swap
              </span>
              <a className="mer-product-tab" href={perpsUrl}>
                <span className="mer-status-dot" aria-hidden="true" />
                Perps
              </a>
            </nav>

            <div className="mer-swap-widget-container">
              <SwapWidget />
            </div>
          </section>
        </main>
      </Scaffold>
    </OrderlyProvider>
  );
}

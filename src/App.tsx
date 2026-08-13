import { type ReactNode } from "react";
import { LocaleProvider } from "@orderly.network/i18n";
import { OrderlyAppProvider } from "@orderly.network/react-app";
import type { NetworkId } from "@orderly.network/types";
import { Scaffold } from "@orderly.network/ui-scaffold";
import { WalletConnectorProvider } from "@orderly.network/wallet-connector";
import { getRuntimeConfig } from "./runtime-config";
import { SwapWidget } from "./SwapWidget";

const NETWORK_ID: NetworkId = "mainnet";

function OrderlyProvider({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider locale="en" onLanguageChanged={async () => undefined}>
      <WalletConnectorProvider>
        <OrderlyAppProvider
          brokerId={getRuntimeConfig("VITE_ORDERLY_BROKER_ID") || "otter_lee"}
          brokerName={getRuntimeConfig("VITE_ORDERLY_BROKER_NAME") || "MERDEX"}
          networkId={NETWORK_ID}
          defaultChain={{ mainnet: { id: 42161 } }}
          appIcons={{
            main: { component: <span className="mer-scaffold-logo">MERDEX</span> },
          }}
        >
          {children}
        </OrderlyAppProvider>
      </WalletConnectorProvider>
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

import { ReactNode, useMemo } from "react";
import { QueryClient } from "@tanstack/query-core";
import type { NetworkId } from "@orderly.network/types";
import {
  WalletConnectorPrivyProvider,
  Network,
} from "@orderly.network/wallet-connector-privy";
import {
  getRuntimeConfig,
  getRuntimeConfigBoolean,
} from "@/utils/runtime-config";
import { getEvmConnectors, getSolanaConfig } from "../../utils/walletConfig";

type LoginMethod = "email" | "passkey" | "twitter" | "google";

const getLoginMethods = (): LoginMethod[] => {
  const loginMethodsEnv = getRuntimeConfig("VITE_PRIVY_LOGIN_METHODS");
  if (!loginMethodsEnv) {
    return ["email"];
  }

  const validMethods: LoginMethod[] = ["email", "passkey", "twitter", "google"];

  return loginMethodsEnv
    .split(",")
    .map((method: string) => method.trim())
    .filter((method: string): method is LoginMethod =>
      validMethods.includes(method as LoginMethod),
    );
};

const PrivyConnector = ({
  children,
  networkId,
}: {
  children: ReactNode;
  networkId: NetworkId;
}) => {
  const appId = getRuntimeConfig("VITE_PRIVY_APP_ID");
  if (!appId) {
    throw new Error(`VITE_PRIVY_APP_ID not set`);
  }
  const termsOfUseUrl = getRuntimeConfig("VITE_PRIVY_TERMS_OF_USE");
  const enableAbstractWallet = getRuntimeConfigBoolean(
    "VITE_ENABLE_ABSTRACT_WALLET",
  );
  const disableEVMWallets = getRuntimeConfigBoolean("VITE_DISABLE_EVM_WALLETS");
  const disableSolanaWallets = getRuntimeConfigBoolean(
    "VITE_DISABLE_SOLANA_WALLETS",
  );
  const loginMethods = useMemo(() => getLoginMethods(), []);
  const wagmiConfig = useMemo(
    () => (disableEVMWallets ? undefined : { connectors: getEvmConnectors() }),
    [disableEVMWallets],
  );
  const solanaConfig = useMemo(
    () => (disableSolanaWallets ? undefined : getSolanaConfig(networkId)),
    [disableSolanaWallets, networkId],
  );
  const privyConfig = useMemo(
    () => ({
      config: {
        appearance: {
          showWalletLoginFirst: false,
        },
        loginMethods,
      },
      appid: appId,
    }),
    [appId, loginMethods],
  );
  const abstractConfig = useMemo(
    () =>
      enableAbstractWallet ? { queryClient: new QueryClient() } : undefined,
    [enableAbstractWallet],
  );

  return (
    <WalletConnectorPrivyProvider
      network={networkId === "mainnet" ? Network.mainnet : Network.testnet}
      termsOfUse={termsOfUseUrl}
      wagmiConfig={wagmiConfig}
      solanaConfig={solanaConfig}
      privyConfig={privyConfig}
      abstractConfig={abstractConfig}
    >
      {children}
    </WalletConnectorPrivyProvider>
  );
};

export default PrivyConnector;

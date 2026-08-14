import { useMemo } from "react";
import type { AppLogos } from "@orderly.network/react-app";
import type {
  FooterProps,
  MainNavWidgetProps,
} from "@orderly.network/ui-scaffold";
import { withBasePath } from "./base-path";
import { getRuntimeConfig, getRuntimeConfigBoolean } from "./runtime-config";

export type OrderlyConfig = {
  orderlyAppProvider: {
    appIcons: AppLogos;
  };
  scaffold: {
    mainNavProps: MainNavWidgetProps;
    footerProps: FooterProps;
  };
};

export const useOrderlyConfig = (): OrderlyConfig => {
  const footerProps = useMemo<FooterProps>(
    () => ({
      telegramUrl: getRuntimeConfig("VITE_TELEGRAM_URL") || undefined,
      discordUrl: getRuntimeConfig("VITE_DISCORD_URL") || undefined,
      twitterUrl: getRuntimeConfig("VITE_TWITTER_URL") || undefined,
    }),
    [],
  );

  const appIcons = useMemo<AppLogos>(
    () => ({
      main: getRuntimeConfigBoolean("VITE_HAS_PRIMARY_LOGO")
        ? {
            component: (
              <img
                src={withBasePath("/logo.webp")}
                alt="logo"
                style={{ height: "42px" }}
              />
            ),
          }
        : { img: withBasePath("/orderly-logo.svg") },
      secondary: {
        img: getRuntimeConfigBoolean("VITE_HAS_SECONDARY_LOGO")
          ? withBasePath("/logo-secondary.webp")
          : withBasePath("/orderly-logo-secondary.svg"),
      },
    }),
    [],
  );

  return useMemo(
    () => ({
      scaffold: {
        mainNavProps: {
          initialMenu: "/swap",
          mainMenus: [{ name: "Swap", href: "/swap" }],
        },
        footerProps,
      },
      orderlyAppProvider: { appIcons },
    }),
    [appIcons, footerProps],
  );
};

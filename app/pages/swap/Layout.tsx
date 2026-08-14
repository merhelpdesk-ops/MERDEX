import { Outlet } from "react-router-dom";
import { Scaffold } from "@orderly.network/ui-scaffold";
import { useNav } from "@/hooks/useNav";
import { useOrderlyConfig } from "@/utils/config";

export default function SwapLayout() {
  const config = useOrderlyConfig();
  const { onRouteChange } = useNav();

  return (
    <Scaffold
      mainNavProps={{
        ...config.scaffold.mainNavProps,
        initialMenu: "/swap",
        mainMenus: [{ name: "Swap", href: "/swap" }],
        campaigns: undefined,
        customRender: (components) => (
          <div className="oui-flex oui-w-full oui-items-center oui-justify-end oui-gap-3">
            <div className="oui-flex oui-items-center oui-gap-2">
              {components.languageSwitcher}
              {components.chainMenu}
              {components.walletConnect}
            </div>
          </div>
        ),
      }}
      footerProps={config.scaffold.footerProps}
      routerAdapter={{
        onRouteChange,
      }}
      bottomNavProps={{ mainMenus: [] }}
    >
      <Outlet />
    </Scaffold>
  );
}

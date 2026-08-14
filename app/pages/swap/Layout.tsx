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
        mainMenus: [],
        campaigns: undefined,
        customRender: (components) => (
          <div className="oui-flex oui-w-full oui-items-center oui-justify-between oui-gap-3">
            <div className="oui-flex oui-items-center">{components.title}</div>
            <div className="oui-flex oui-items-center oui-gap-2">
              {components.accountSummary}
              {components.linkDevice}
              {components.scanQRCode}
              {components.languageSwitcher}
              {components.subAccount}
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

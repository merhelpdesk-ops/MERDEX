import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DexThemeConfigSchema,
  getDexThemeConfig,
  getLegacyTradingViewConfig,
  getTradingViewColorConfigForSource,
  resolveDexThemeConfig,
} from "./theme-config";

const createTheme = (overrides: Record<string, unknown> = {}) => ({
  id: "00000000-0000-4000-8000-000000000001",
  displayName: "Default",
  mode: "dark",
  isDefault: true,
  ...overrides,
});

const setRuntimeConfig = (config: Record<string, string>) => {
  window.__RUNTIME_CONFIG__ = config;
};

describe("DexThemeConfigSchema", () => {
  it("accepts one to six themes with partial CSS and TradingView overrides", () => {
    const theme = createTheme({
      cssVars: { "--oui-color-primary": "176 132 233" },
      tradingViewColorConfig: { chartBG: "#131519" },
    });

    expect(DexThemeConfigSchema.safeParse([theme]).success).toBe(true);
    expect(
      DexThemeConfigSchema.safeParse(
        Array.from({ length: 6 }, (_, index) =>
          createTheme({
            id: `00000000-0000-4000-8000-00000000000${index + 1}`,
            displayName: `Theme ${index + 1}`,
            isDefault: index === 0,
            cssVars: {},
            tradingViewColorConfig: {},
          }),
        ),
      ).success,
    ).toBe(true);
  });

  it("rejects more than six themes and invalid default selection", () => {
    const themes = Array.from({ length: 7 }, (_, index) =>
      createTheme({
        id: `00000000-0000-4000-8000-00000000000${index + 1}`,
        displayName: `Theme ${index + 1}`,
        isDefault: index === 0,
      }),
    );

    expect(DexThemeConfigSchema.safeParse(themes).success).toBe(false);
    expect(
      DexThemeConfigSchema.safeParse([createTheme({ isDefault: false })])
        .success,
    ).toBe(false);
    expect(
      DexThemeConfigSchema.safeParse([
        createTheme(),
        createTheme({
          id: "00000000-0000-4000-8000-000000000002",
          displayName: "Light",
          mode: "light",
        }),
      ]).success,
    ).toBe(false);
  });

  it("rejects duplicate ids and case-insensitive duplicate names", () => {
    expect(
      DexThemeConfigSchema.safeParse([
        createTheme(),
        createTheme({
          displayName: "default",
          mode: "light",
          isDefault: false,
        }),
      ]).success,
    ).toBe(false);
  });

  it("rejects unknown CSS variables and unsupported TradingView fields", () => {
    for (const tradingViewColorConfig of [
      { pnlZoreColor: "#333948" },
      { font: "Manrope" },
      { liqLineColor: "#f0b90b" },
    ]) {
      expect(
        DexThemeConfigSchema.safeParse([
          createTheme({ tradingViewColorConfig }),
        ]).success,
      ).toBe(false);
    }

    expect(
      DexThemeConfigSchema.safeParse([
        createTheme({ cssVars: { "--not-an-orderly-variable": "value" } }),
      ]).success,
    ).toBe(false);
  });

  it("validates TradingView color formats and rgba channel bounds", () => {
    expect(
      DexThemeConfigSchema.safeParse([
        createTheme({
          tradingViewColorConfig: {
            chartBG: "red",
            closeIconColor: "rgba(255, 255, 255, 0.8)",
          },
        }),
      ]).success,
    ).toBe(false);

    for (const closeIconColor of [
      "rgba(256, 255, 255, 0.8)",
      "rgba(255, 255, 255, 1.1)",
      "rgb(255, 255, 255)",
    ]) {
      expect(
        DexThemeConfigSchema.safeParse([
          createTheme({ tradingViewColorConfig: { closeIconColor } }),
        ]).success,
      ).toBe(false);
    }

    expect(
      DexThemeConfigSchema.safeParse([
        createTheme({
          tradingViewColorConfig: {
            chartBG: "#fff",
            closeIconColor: "rgba(255, 255, 255, 0.8)",
          },
        }),
      ]).success,
    ).toBe(true);
  });
});

describe("getDexThemeConfig", () => {
  beforeEach(() => {
    setRuntimeConfig({});
  });

  afterEach(() => {
    delete window.__RUNTIME_CONFIG__;
  });

  it("uses the strict ThemeConfig array when it is valid", () => {
    const themes = [
      createTheme({
        tradingViewColorConfig: { pnlZeroColor: "#333948" },
      }),
    ];
    setRuntimeConfig({ VITE_ORDERLY_THEME_CONFIG: JSON.stringify(themes) });

    const resolution = resolveDexThemeConfig();
    expect(resolution.themes).toEqual(themes);
    expect(resolveDexThemeConfig()).toBe(resolution);
    expect(getDexThemeConfig()).toBe(resolution.themes);
  });

  it("does not expose legacy TradingView colors when the theme array is valid", () => {
    const themes = [
      createTheme({ tradingViewColorConfig: { chartBG: "#131519" } }),
    ];
    setRuntimeConfig({
      VITE_ORDERLY_THEME_CONFIG: JSON.stringify(themes),
      VITE_TRADING_VIEW_COLOR_CONFIG: JSON.stringify({
        upColor: "#ff0000",
      }),
    });

    expect(resolveDexThemeConfig().source).toBe("theme-config");
    expect(getTradingViewColorConfigForSource("theme-config")).toBeUndefined();
  });

  it("falls back to a single default theme using the legacy TradingView config", () => {
    setRuntimeConfig({
      VITE_ORDERLY_THEME_CONFIG: "not-json",
      VITE_TRADING_VIEW_COLOR_CONFIG: JSON.stringify({
        chartBG: "#131519",
        pnlZoreColor: "#333948",
        font: "Manrope",
      }),
    });

    expect(getDexThemeConfig()).toEqual([
      {
        id: "00000000-0000-4000-8000-000000000001",
        displayName: "Default",
        mode: "dark",
        isDefault: true,
        tradingViewColorConfig: { chartBG: "#131519" },
      },
    ]);
    expect(resolveDexThemeConfig().source).toBe("legacy");
    expect(getTradingViewColorConfigForSource("legacy")).toEqual({
      chartBG: "#131519",
      pnlZoreColor: "#333948",
      font: "Manrope",
    });
  });

  it("keeps legacy TradingView fields for the existing TradingPage config", () => {
    setRuntimeConfig({
      VITE_TRADING_VIEW_COLOR_CONFIG: JSON.stringify({
        pnlZoreColor: "#333948",
        font: "Manrope",
        closeIconColor: "rgba(255, 255, 255, 0.8)",
      }),
    });

    expect(getLegacyTradingViewConfig()).toEqual({
      pnlZoreColor: "#333948",
      font: "Manrope",
      closeIconColor: "rgba(255, 255, 255, 0.8)",
    });
  });

  it("infers a light fallback theme from a light legacy chart background", () => {
    setRuntimeConfig({
      VITE_TRADING_VIEW_COLOR_CONFIG: JSON.stringify({ chartBG: "#fff" }),
    });

    expect(getDexThemeConfig()[0].mode).toBe("light");
  });
});

import { z } from "zod";
import { DARK_THEME_CSS_VARS, type ThemeCssVars } from "@orderly.network/ui";
import { getRuntimeConfig } from "./runtime-config";

const THEME_CONFIG_KEY = "VITE_ORDERLY_THEME_CONFIG";
const LEGACY_TRADING_VIEW_COLOR_CONFIG_KEY = "VITE_TRADING_VIEW_COLOR_CONFIG";
const LEGACY_DEFAULT_THEME_ID = "00000000-0000-4000-8000-000000000001";

const cssVarsSchemaShape = Object.fromEntries(
  Object.keys(DARK_THEME_CSS_VARS).map((key) => [key, z.string().min(1)]),
) as { [Key in keyof ThemeCssVars]: z.ZodString };

const CssVarsSchema = z.strictObject(cssVarsSchemaShape).partial();

const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#(?:[\da-f]{3}|[\da-f]{6})$/i);

const isValidRgbaColor = (value: string): boolean => {
  const matchedColor = value.match(
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)$/i,
  );

  if (!matchedColor) {
    return false;
  }

  const [red, green, blue, alpha] = matchedColor.slice(1).map(Number);
  return red <= 255 && green <= 255 && blue <= 255 && alpha >= 0 && alpha <= 1;
};

const CloseIconColorSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      HexColorSchema.safeParse(value).success || isValidRgbaColor(value),
    "Expected a hex color or an rgba color with valid channels",
  );

const TradingViewColorConfigSchema = z
  .strictObject({
    chartBG: HexColorSchema,
    upColor: HexColorSchema,
    downColor: HexColorSchema,
    pnlUpColor: HexColorSchema,
    pnlDownColor: HexColorSchema,
    pnlZeroColor: HexColorSchema,
    textColor: HexColorSchema,
    qtyTextColor: HexColorSchema,
    volumeUpColor: HexColorSchema,
    volumeDownColor: HexColorSchema,
    closeIconColor: CloseIconColorSchema,
  })
  .partial();

const ThemeSchema = z.strictObject({
  id: z.uuid(),
  displayName: z.string().trim().min(1).max(50),
  mode: z.enum(["dark", "light"]),
  cssVars: CssVarsSchema.optional(),
  tradingViewColorConfig: TradingViewColorConfigSchema.optional(),
  isDefault: z.boolean().optional(),
});

export const DexThemeConfigSchema = z
  .array(ThemeSchema)
  .min(1)
  .max(6)
  .superRefine((themes, ctx) => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    let defaultCount = 0;

    themes.forEach((theme, index) => {
      if (seenIds.has(theme.id)) {
        ctx.addIssue({
          code: "custom",
          message: "Theme ids must be unique",
          path: [index, "id"],
        });
      }
      seenIds.add(theme.id);

      const normalizedName = theme.displayName.toLowerCase();
      if (seenNames.has(normalizedName)) {
        ctx.addIssue({
          code: "custom",
          message: "Theme display names must be unique",
          path: [index, "displayName"],
        });
      }
      seenNames.add(normalizedName);

      if (theme.isDefault) {
        defaultCount += 1;
      }
    });

    if (defaultCount !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Exactly one theme must be the default",
        path: ["isDefault"],
      });
    }
  });

export type TradingViewColorConfig = z.infer<
  typeof TradingViewColorConfigSchema
>;

export type DexThemeConfig = Array<{
  id: string;
  displayName: string;
  mode: "dark" | "light";
  cssVars?: Partial<ThemeCssVars>;
  tradingViewColorConfig?: TradingViewColorConfig;
  isDefault?: boolean;
}>;

export type LegacyTradingViewConfig = Record<string, string>;

export type DexThemeConfigResolution = {
  themes: DexThemeConfig;
  source: "theme-config" | "legacy";
};

const LegacyTradingViewColorConfigSchema = z
  .object({
    chartBG: HexColorSchema,
    upColor: HexColorSchema,
    downColor: HexColorSchema,
    pnlUpColor: HexColorSchema,
    pnlDownColor: HexColorSchema,
    pnlZeroColor: HexColorSchema,
    textColor: HexColorSchema,
    qtyTextColor: HexColorSchema,
    volumeUpColor: HexColorSchema,
    volumeDownColor: HexColorSchema,
    closeIconColor: CloseIconColorSchema,
  })
  .partial();

const parseJson = (value: string | undefined): unknown => {
  if (!value?.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
};

const parseLegacyTradingViewColorConfig = (
  value: string | undefined,
): TradingViewColorConfig | undefined => {
  const parsed = LegacyTradingViewColorConfigSchema.safeParse(parseJson(value));
  return parsed.success ? parsed.data : undefined;
};

export const getLegacyTradingViewConfig = ():
  | LegacyTradingViewConfig
  | undefined => {
  const parsed = z
    .record(z.string(), z.string())
    .safeParse(
      parseJson(getRuntimeConfig(LEGACY_TRADING_VIEW_COLOR_CONFIG_KEY)),
    );

  return parsed.success ? parsed.data : undefined;
};

export const getTradingViewColorConfigForSource = (
  source: DexThemeConfigResolution["source"],
): LegacyTradingViewConfig | undefined =>
  source === "legacy" ? getLegacyTradingViewConfig() : undefined;

export const getLegacyTradingViewColorConfig = ():
  | TradingViewColorConfig
  | undefined =>
  parseLegacyTradingViewColorConfig(
    getRuntimeConfig(LEGACY_TRADING_VIEW_COLOR_CONFIG_KEY),
  );

const getLegacyThemeMode = (
  tradingViewColorConfig: TradingViewColorConfig | undefined,
): "dark" | "light" => {
  const chartBackground = tradingViewColorConfig?.chartBG?.trim();
  const matchedColor = chartBackground?.match(/^#([\da-f]{3}|[\da-f]{6})$/i);

  if (!matchedColor) {
    return "dark";
  }

  const hex =
    matchedColor[1].length === 3
      ? matchedColor[1]
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : matchedColor[1];
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 255000;

  return brightness > 0.5 ? "light" : "dark";
};

let cachedThemeConfigInput: string | undefined;
let cachedLegacyColorConfigInput: string | undefined;
let cachedResolution: DexThemeConfigResolution | undefined;

export const resolveDexThemeConfig = (): DexThemeConfigResolution => {
  const themeConfigInput = getRuntimeConfig(THEME_CONFIG_KEY);
  const legacyColorConfigInput = getRuntimeConfig(
    LEGACY_TRADING_VIEW_COLOR_CONFIG_KEY,
  );

  if (
    cachedResolution &&
    cachedThemeConfigInput === themeConfigInput &&
    cachedLegacyColorConfigInput === legacyColorConfigInput
  ) {
    return cachedResolution;
  }

  const parsed = DexThemeConfigSchema.safeParse(parseJson(themeConfigInput));

  if (parsed.success) {
    cachedResolution = {
      themes: parsed.data,
      source: "theme-config",
    };
  } else {
    const tradingViewColorConfig = parseLegacyTradingViewColorConfig(
      legacyColorConfigInput,
    );

    cachedResolution = {
      source: "legacy",
      themes: [
        {
          id: LEGACY_DEFAULT_THEME_ID,
          displayName: "Default",
          mode: getLegacyThemeMode(tradingViewColorConfig),
          isDefault: true,
          ...(tradingViewColorConfig ? { tradingViewColorConfig } : {}),
        },
      ],
    };
  }

  cachedThemeConfigInput = themeConfigInput;
  cachedLegacyColorConfigInput = legacyColorConfigInput;
  return cachedResolution;
};

export const getDexThemeConfig = (): DexThemeConfig =>
  resolveDexThemeConfig().themes;

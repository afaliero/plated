/**
 * Design tokens.
 */

export const color = {
  brand: "#6F212B",
  brandPressed: "#571A21",
  brandSubtle: "#F6EAEC",
  onBrand: "#FFFFFF",

  bg: "#FFFFFF",
  surface: "#EDEDED",
  border: "#D8D8D8",

  text: "#1A1A1A",
  textBody: "#333333",
  textMuted: "#666666",
  /** Placeholder copy and inert input icons — lighter than textMuted. */
  textPlaceholder: "#8A8A8A",

  /**
   * Deliberately brighter and warmer than `brand`. The previous #B00020 sat
   * too close to the oxblood to read as an alert beside it.
   */
  danger: "#C9392A",
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  /** Fully rounded — the filter pills in the header. */
  pill: 999,
} as const;

export const fontSize = {
  xs: 13,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 18,
  display: 24,
} as const;

/** Typed as string literals so they satisfy RN's TextStyle["fontWeight"]. */
export const fontWeight = {
  regular: "400",
  semibold: "600",
  bold: "700",
} as const;

export type ColorToken = keyof typeof color;
export type SpaceToken = keyof typeof space;

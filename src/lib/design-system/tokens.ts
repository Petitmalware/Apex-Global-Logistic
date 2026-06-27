export const colorTokens = {
  accent: "var(--accent)",
  background: "var(--background)",
  border: "var(--border)",
  card: "var(--card)",
  destructive: "var(--destructive)",
  foreground: "var(--foreground)",
  info: "var(--info)",
  muted: "var(--muted)",
  primary: "var(--primary)",
  success: "var(--success)",
  surface: "var(--surface)",
  warning: "var(--warning)",
} as const;

export const spacingTokens = {
  "2xs": "0.25rem",
  xs: "0.5rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
  "3xl": "4rem",
} as const;

export const radiusTokens = {
  lg: "var(--radius-lg)",
  md: "var(--radius-md)",
  sm: "var(--radius-sm)",
  xl: "var(--radius-xl)",
} as const;

export const elevationTokens = {
  panel: "var(--shadow-panel)",
  soft: "var(--shadow-soft)",
} as const;

export type ColorToken = keyof typeof colorTokens;
export type SpacingToken = keyof typeof spacingTokens;

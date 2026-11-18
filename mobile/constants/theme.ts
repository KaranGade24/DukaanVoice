/**
 * Shared design tokens extracted from the DukaanVoice Stitch screens.
 * Keep these values aligned with the Tailwind tokens in global.css.
 */
export const colors = {
  primary: "#168447",
  primaryPressed: "#106B38",
  primaryDeep: "#006935",
  secondary: "#136C39",
  accent: "#A0F5B4",
  onPrimary: "#FFFFFF",
  background: "#F0FDF3",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  surfaceSubtle: "#F7F9F7",
  surfaceMint: "#F3FAF5",
  surfaceTint: "#E8F5EC",
  textPrimary: "#202B25",
  textSecondary: "#66736B",
  muted: "#96A19A",
  controlDisabled: "#C9D1CB",
  border: "#E5EAE6",
  borderPrimary: "#CDE8D5",
  success: "#168447",
  successBackground: "#E8F5EC",
  warning: "#D97706",
  warningBackground: "#FFF5E5",
  error: "#DC2626",
  errorBackground: "#FEECEC",
  info: "#2563EB",
  infoBackground: "#EFF6FF",
  scrim: "rgba(32, 43, 37, 0.4)",
} as const;

export const typography = {
  fontFamily: {
    display: "Inter",
    body: "Noto Sans",
  },
  display: { fontSize: 30, lineHeight: 38, fontWeight: "700" },
  headlineLarge: { fontSize: 24, lineHeight: 32, fontWeight: "700" },
  headlineSmall: { fontSize: 18, lineHeight: 24, fontWeight: "600" },
  title: { fontSize: 16, lineHeight: 22, fontWeight: "600" },
  bodyLarge: { fontSize: 15, lineHeight: 22, fontWeight: "500" },
  body: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
  bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: "400" },
  label: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  navigation: { fontSize: 11, lineHeight: 14, fontWeight: "500" },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screenGutter: 16,
  section: 24,
  cardPadding: 16,
  compactTilePadding: 12,
} as const;

export const borderRadius = {
  chip: 8,
  button: 10,
  input: 10,
  card: 14,
  sheet: 20,
  full: 9999,
} as const;

export const dimensions = {
  minTouchTarget: 48,
  buttonHeight: 48,
  inputHeight: 48,
  categoryChipHeight: 36,
  voiceFab: 64,
  productThumbnail: 64,
  bottomNavigation: 68,
} as const;

export const shadows = {
  voiceFab: {
    shadowColor: "#168447",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bottomSheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  dimensions,
  shadows,
} as const;

export default theme;

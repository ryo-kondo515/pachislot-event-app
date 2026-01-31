export const themeColors: {
  primary: { light: string; dark: string };
  background: { light: string; dark: string };
  surface: { light: string; dark: string };
  foreground: { light: string; dark: string };
  muted: { light: string; dark: string };
  border: { light: string; dark: string };
  success: { light: string; dark: string };
  warning: { light: string; dark: string };
  error: { light: string; dark: string };
  // カスタムカラー（アツさレベル）
  hotSuper: { light: string; dark: string };
  hotHigh: { light: string; dark: string };
  hotMedium: { light: string; dark: string };
  hotNormal: { light: string; dark: string };
  hotLow: { light: string; dark: string };
  // アクセントカラー
  gold: { light: string; dark: string };
  silver: { light: string; dark: string };
  neonPink: { light: string; dark: string };
  neonCyan: { light: string; dark: string };
};

declare const themeConfig: {
  themeColors: typeof themeColors;
};

export default themeConfig;

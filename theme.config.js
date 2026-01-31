/** @type {const} */
const themeColors = {
  // パチスロ風ダークテーマ - ネオンカラーが映える黒背景
  primary: { light: '#FF1744', dark: '#FF1744' },        // ネオンレッド
  background: { light: '#0D0D0D', dark: '#0D0D0D' },     // ディープブラック
  surface: { light: '#1A1A2E', dark: '#1A1A2E' },        // ダークパープル
  foreground: { light: '#FFFFFF', dark: '#FFFFFF' },     // ホワイト
  muted: { light: '#9E9E9E', dark: '#9E9E9E' },          // グレー
  border: { light: '#333333', dark: '#333333' },         // ダークグレー
  success: { light: '#00E676', dark: '#00E676' },        // ネオングリーン
  warning: { light: '#FFD600', dark: '#FFD600' },        // ゴールドイエロー
  error: { light: '#FF1744', dark: '#FF1744' },          // ネオンレッド
  // カスタムカラー（アツさレベル）
  hotSuper: { light: '#FF1744', dark: '#FF1744' },       // 超アツ
  hotHigh: { light: '#FF9100', dark: '#FF9100' },        // アツ
  hotMedium: { light: '#FFD600', dark: '#FFD600' },      // やや熱
  hotNormal: { light: '#00E5FF', dark: '#00E5FF' },      // 普通
  hotLow: { light: '#2979FF', dark: '#2979FF' },         // 低
  // アクセントカラー
  gold: { light: '#FFD700', dark: '#FFD700' },           // ゴールド
  silver: { light: '#C0C0C0', dark: '#C0C0C0' },         // シルバー
  neonPink: { light: '#FF4081', dark: '#FF4081' },       // ネオンピンク
  neonCyan: { light: '#00E5FF', dark: '#00E5FF' },       // ネオンシアン
};

module.exports = { themeColors };

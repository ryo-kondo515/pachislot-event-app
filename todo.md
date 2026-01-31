# Project TODO

## Phase 1: MVP機能

- [x] テーマ設定（パチスロ風ダークテーマ）
- [x] アイコンマッピングの追加
- [x] データモデル定義（店舗、イベント、演者）
- [x] モックデータ作成
- [x] 地図画面の実装
- [x] 店舗ピン表示（色・サイズ変化）
- [x] 店舗詳細画面の実装
- [x] お気に入り画面の実装
- [x] 設定画面の実装
- [x] タブナビゲーションの構築
- [x] アプリアイコンの生成

## 将来の機能（Phase 2以降）

- [ ] ユーザー認証機能
- [ ] プッシュ通知機能
- [ ] 位置情報連動機能
- [ ] 演者ランキング機能
- [ ] 広告SDK統合
- [ ] 有料掲載機能

## バグ修正

- [x] react-native-mapsをexpo-mapsに置き換え（Expo Go対応）
- [x] 地図画面のインポート文を修正
- [x] 地図コンポーネントの動作確認

## Expo Go地図表示問題

- [x] Expo Goでの地図表示エラーの原因調査
- [x] react-native-mapsの条件付きインポートロジックを修正
- [x] 地図コンポーネントの動作確認（実機テスト）

## Expo Go react-native-maps問題

- [x] react-native-mapsがExpo Goで使用できない問題の確認
- [x] 地図機能を静的な店舗リスト表示に変更
- [x] モバイル・Web両方で動作する店舗一覧UIの実装

## Development Build対応

- [x] react-native-mapsの再インストール
- [x] 地図画面の実装（インタラクティブマップ）
- [x] app.config.tsの更新（react-native-mapsプラグイン追加）
- [x] Development Build用の設定完了

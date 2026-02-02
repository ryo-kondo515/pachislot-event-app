# アツマチ (Atsumachi)

パチスロ来店イベント情報を集約するモバイルアプリ

## プロジェクト概要

アツマチは、複数のパチスロ情報サイトから来店イベント情報を自動収集し、ユーザーに提供するReact Nativeアプリです。ユーザーは当日のイベント情報を一覧で確認し、店舗の公式ホームページにアクセスできます。

## 主な機能

- **来店イベント情報の自動収集**: 複数のソースから最新のイベント情報をスクレイピング
- **店舗一覧表示**: 当日のイベントがある店舗を一覧表示
- **店舗詳細表示**: 店舗情報、イベント情報、演者情報を表示
- **公式HP連携**: 店舗の公式ホームページへのリンク
- **アツさレベル表示**: イベントの注目度を5段階で表示

## 技術スタック

- **フロントエンド**: React Native 0.81 + Expo SDK 54
- **スタイリング**: NativeWind 4 (Tailwind CSS)
- **バックエンド**: Express + tRPC
- **データベース**: MySQL + Drizzle ORM
- **スクレイピング**: Puppeteer + Cheerio
- **テスト**: Vitest

## プロジェクト構造

```
pachislot-event-app/
├── app/                      # Expo Router アプリケーション
│   ├── (tabs)/              # タブナビゲーション
│   │   └── index.tsx        # 店舗一覧画面
│   └── store/               # 店舗詳細画面
│       └── [id].tsx         # 動的ルート
├── server/                   # バックエンドサーバー
│   ├── _core/               # コア機能
│   ├── scrapers/            # スクレイピング機能
│   │   ├── drillermaguro.ts
│   │   ├── raitenex.ts
│   │   └── index.ts
│   ├── utils/               # ユーティリティ
│   │   └── store-url-finder.ts
│   ├── routers.ts           # tRPCルーター
│   └── routers-scraper.ts   # スクレイピングAPI
├── drizzle/                 # データベーススキーマ
│   └── schema.ts
├── tests/                   # テストファイル
├── docs/                    # ドキュメント
│   ├── DEVELOPMENT.md       # 開発者ガイド
│   ├── SCRAPING.md          # スクレイピング仕様
│   └── API.md               # API仕様書
└── README.md                # このファイル
```

## セットアップ

### 必要な環境

- Node.js 22.13.0
- pnpm 9.12.0
- MySQL 8.0+

### インストール

```bash
# 依存関係のインストール
pnpm install

# データベースのマイグレーション
pnpm db:push

# 開発サーバーの起動
pnpm dev
```

### 環境変数

プロジェクトには以下の環境変数が設定されています（Management UI > Settings > Secretsで管理）:

- `EXPO_PUBLIC_API_BASE_URL`: APIサーバーのベースURL
- `JWT_SECRET`: JWT認証用のシークレットキー
- その他の認証関連の環境変数

## 開発

### 開発サーバー

```bash
# フロントエンド + バックエンドを同時起動
pnpm dev

# フロントエンドのみ起動
pnpm dev:metro

# バックエンドのみ起動
pnpm dev:server
```

### テスト

```bash
# 全テストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test tests/api-connection.test.ts
```

### スクレイピング

```bash
# スクレイピングを手動実行
pnpm tsx server/run-scraper.ts

# 店舗公式URLを一括更新
pnpm tsx server/update-store-urls.ts
```

#### 自動実行（GitHub Actions）

GitHub Actionsで毎日0:01（JST）に自動的にスクレイピングが実行されます。

**必要なGitHub Secrets設定**:

リポジトリの `Settings > Secrets and variables > Actions` で以下を設定してください:

- `DATABASE_URL`: MySQL接続文字列（例: `mysql://user:pass@host:3306/db`）
- `BUILT_IN_FORGE_API_KEY`: LLM API認証キー
- `BUILT_IN_FORGE_API_URL`: LLM APIエンドポイント（オプション）

**手動実行**:

GitHub ActionsのUIから「Actions」タブ > 「Daily Scraping」 > 「Run workflow」で手動実行できます。

**実行状態の確認**:

```bash
# GitHub CLIで実行履歴を確認
gh run list --workflow=scraping.yml

# 最新の実行ログを表示
gh run view --log
```

## Expo Goでの動作確認

1. Expo Goアプリをインストール（iOS/Android）
2. Management UI > PreviewパネルでQRコードを表示
3. Expo Goアプリでスキャン

## Claude Codeでの開発

このプロジェクトはClaude Codeから直接編集できます。以下のドキュメントを参照してください:

- [開発者ガイド](docs/DEVELOPMENT.md) - プロジェクトの詳細な開発手順
- [スクレイピング仕様](docs/SCRAPING.md) - スクレイピング機能の実装詳細
- [API仕様書](docs/API.md) - tRPC APIの仕様

## データベース

### テーブル構成

- `stores`: 店舗情報（名前、住所、緯度経度、公式URLなど）
- `events`: イベント情報（日付、アツさレベル、機種、説明など）
- `actors`: 演者情報（名前、ランキングなど）
- `users`: ユーザー情報（認証用）

### データベース管理

Management UI > Databaseパネルから、データベースの内容を確認・編集できます。

## デプロイ

1. チェックポイントを作成: `webdev_save_checkpoint`
2. Management UI > Publishボタンをクリック
3. デプロイ先のURLが発行されます

## トラブルシューティング

### Expo Goで502エラーが出る

`EXPO_PUBLIC_API_BASE_URL`環境変数が正しく設定されているか確認してください。

### スクレイピングが失敗する

Puppeteerのブラウザが起動しない場合、サーバーを再起動してください:

```bash
pnpm dev
```

### データベース接続エラー

データベースのマイグレーションを実行してください:

```bash
pnpm db:push
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

# アツマチ (Atsumachi)

パチスロ来店イベント情報を集約するモバイルアプリ

## プロジェクト概要

アツマチは、全国のパチスロ店舗の来店イベント情報を自動収集・集約するモバイルアプリケーションです。複数の情報ソースから最新のイベント情報を収集し、地図上での表示、検索、フィルタリング機能を提供します。AI（LLM）を活用した高精度なイベント情報抽出により、ユーザーに正確で最新の情報を届けます。

## 主な機能

- **来店イベント情報の自動収集**: 複数のソースから最新のイベント情報をスクレイピング
- **店舗一覧表示**: 当日のイベントがある店舗を地図上に表示
- **店舗詳細表示**: 店舗情報、イベント情報、演者情報を表示
- **イベント一覧**: イベント情報を日付順に一覧表示
- **お気に入り機能**: 気になる店舗をお気に入りに登録
- **地域フィルター**: 地域や都道府県でイベントをフィルター
- **検索機能**: 店舗名やエリアで検索
- **公式HP連携**: 店舗の公式ホームページへのリンク
- **アツさレベル表示**: イベントの注目度を5段階で表示
- **AI統合**: LLMを活用したイベント情報の自動抽出

## 技術スタック

### フロントエンド
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo SDK**: 54
- **ルーティング**: Expo Router 6 (file-based routing)
- **スタイリング**: NativeWind 4 (Tailwind CSS)
- **状態管理**: TanStack React Query 5
- **地図表示**: Expo Location + Web Map (Google Maps API)

### バックエンド
- **サーバー**: Express
- **API**: tRPC 11 (type-safe API)
- **データベース**: PostgreSQL + Drizzle ORM
- **認証**: Supabase Auth
- **スクレイピング**: Puppeteer + Cheerio
- **ジオコーディング**: Google Geocoding API
- **AI統合**: LLM APIを活用したイベント情報抽出

### 開発ツール
- **言語**: TypeScript
- **パッケージマネージャー**: pnpm 9.12.0
- **テスト**: Vitest
- **ビルド**: esbuild
- **コード品質**: ESLint + Prettier

## プロジェクト構造

```
pachislot-event-app/
├── app/                           # Expo Router アプリケーション
│   ├── (tabs)/                    # タブナビゲーション
│   │   ├── index.tsx              # 店舗マップ画面（ホーム）
│   │   ├── events.tsx             # イベント一覧画面
│   │   ├── favorites.tsx          # お気に入り画面
│   │   └── settings.tsx           # 設定画面
│   ├── store/                     # 店舗詳細画面
│   │   └── [id].tsx               # 動的ルート
│   ├── oauth/                     # 認証関連
│   └── _layout.tsx                # ルートレイアウト
├── components/                    # 再利用可能なコンポーネント
│   ├── filter-panel.tsx           # フィルターパネル
│   ├── region-selector.tsx        # 地域選択
│   ├── search-bar.tsx             # 検索バー
│   ├── web-map.tsx                # Web用地図コンポーネント
│   └── ui/                        # UIコンポーネント
├── server/                        # バックエンドサーバー
│   ├── _core/                     # コア機能（サーバー起動等）
│   ├── scrapers/                  # スクレイピング機能
│   │   ├── index.ts               # スクレイパー統合
│   │   ├── llm-parser.ts          # LLMパーサー
│   │   ├── deduplication-utils.ts # 重複除去ユーティリティ
│   │   └── cleanup-past-events.ts # 過去イベント削除
│   ├── utils/                     # ユーティリティ
│   │   └── store-url-finder.ts    # 店舗URL検索
│   ├── routers.ts                 # tRPCメインルーター
│   ├── routers-actors.ts          # 演者API
│   ├── routers-scraper.ts         # スクレイピングAPI
│   ├── geocoding.ts               # ジオコーディング
│   ├── ranking.ts                 # ランキング計算
│   └── db-postgres.ts             # データベース接続
├── shared/                        # 共有コード
│   ├── _core/                     # コア型定義
│   ├── const.ts                   # 定数
│   └── types.ts                   # 型定義
├── drizzle/                       # データベーススキーマ
│   ├── schema-postgres.ts         # PostgreSQLスキーマ
│   └── migrations-postgres/       # マイグレーションファイル
├── tests/                         # テストファイル
├── docs/                          # ドキュメント
│   ├── DEVELOPMENT.md             # 開発者ガイド
│   ├── SCRAPING.md                # スクレイピング仕様
│   └── API.md                     # API仕様書
├── app.config.ts                  # Expo設定
├── drizzle-postgres.config.ts     # Drizzle設定
└── README.md                      # このファイル
```

## セットアップ

### 必要な環境

- Node.js 22.13.0以降
- pnpm 9.12.0
- PostgreSQL 14以降（または Supabase）

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

プロジェクトルートに `.env` ファイルを作成し、以下の環境変数を設定してください:

#### 必須の環境変数

```bash
# データベース接続（PostgreSQL）
DATABASE_URL_POSTGRES=postgresql://user:password@host:5432/dbname

# Supabase認証
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# APIエンドポイント（開発時）
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

#### オプションの環境変数

```bash
# Google Maps API（ジオコーディング用）
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# LLM API（イベント情報抽出用）
BUILT_IN_FORGE_API_KEY=your-llm-api-key
BUILT_IN_FORGE_API_URL=https://your-llm-api-endpoint

# JWT認証（レガシー、Supabase移行後は不要）
JWT_SECRET=your-jwt-secret
```

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

このアプリは、複数のソースから自動的にイベント情報を収集します。

```bash
# スクレイピングを手動実行
pnpm tsx server/run-scraper.ts

# 店舗公式URLを一括更新
pnpm tsx server/update-store-urls.ts

# ジオコーディング（緯度経度）を更新
pnpm tsx server/update-geocoding.ts
```

#### 自動実行（GitHub Actions）

GitHub Actionsで毎日0:01（JST）に自動的にスクレイピングが実行されます。

**必要なGitHub Secrets設定**:

リポジトリの `Settings > Secrets and variables > Actions` で以下を設定してください:

- `DATABASE_URL_POSTGRES`: PostgreSQL接続文字列（例: `postgresql://user:pass@host:5432/db`）
- `GOOGLE_MAPS_API_KEY`: Google Maps API キー（ジオコーディング用）
- `BUILT_IN_FORGE_API_KEY`: LLM API認証キー（オプション）
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

## モバイルでの動作確認

### Expo Goを使う場合（開発中）

1. Expo Goアプリをインストール（iOS/Android）
2. `pnpm dev` を実行してQRコードを表示
3. Expo Goアプリでスキャン

### 本番ビルド

```bash
# iOSビルド
pnpm ios

# Androidビルド
pnpm android

# QRコード生成（開発用）
pnpm qr
```

## 開発ドキュメント

詳細な開発情報については、以下のドキュメントを参照してください:

- [開発者ガイド](docs/DEVELOPMENT.md) - プロジェクトの詳細な開発手順
- [スクレイピング仕様](docs/SCRAPING.md) - スクレイピング機能の実装詳細
- [API仕様書](docs/API.md) - tRPC APIの仕様

## データベース

### テーブル構成

- `stores`: 店舗情報
  - 名前、住所、緯度経度、エリア、公式URL、ソースURL
  - 台数、営業時間、プレミアムフラグ
- `events`: イベント情報
  - 店舗ID、演者ID、イベント日時
  - アツさレベル（1-5）、機種情報、説明文
  - ソースURL
- `actors`: 演者情報
  - 名前、画像URL、ランクスコア
- `users`: ユーザー情報（Supabase Auth連携）
  - Supabase UUID、OpenID（レガシー）
  - 名前、メール、ログイン方法、ロール

### データベース管理

```bash
# マイグレーションファイルの生成
pnpm drizzle-kit generate

# データベースにマイグレーションを適用
pnpm drizzle-kit migrate

# Drizzle Studioでデータベースを確認
pnpm drizzle-kit studio
```

## デプロイ

### バックエンド

```bash
# ビルド
pnpm build

# 本番環境で起動
pnpm start
```

### Expoアプリ

Expo Application Services (EAS) を使用してビルド・デプロイできます:

```bash
# EAS CLIのインストール
npm install -g eas-cli

# EASにログイン
eas login

# ビルド（iOS）
eas build --platform ios

# ビルド（Android）
eas build --platform android

# アップデート配信
eas update
```

## トラブルシューティング

### Expo Goで502エラーが出る

`EXPO_PUBLIC_API_BASE_URL`環境変数が正しく設定されているか確認してください:

```bash
# .envファイルを確認
cat .env | grep EXPO_PUBLIC_API_BASE_URL
```

### スクレイピングが失敗する

Puppeteerのブラウザが起動しない場合、サーバーを再起動してください:

```bash
pnpm dev
```

Windows環境の場合、追加の設定が必要な場合があります。

### データベース接続エラー

1. PostgreSQLが起動しているか確認
2. `DATABASE_URL_POSTGRES`環境変数が正しいか確認
3. マイグレーションを実行:

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Supabase認証エラー

`EXPO_PUBLIC_SUPABASE_URL`と`EXPO_PUBLIC_SUPABASE_ANON_KEY`が正しく設定されているか確認してください。

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

# 開発者ガイド

このドキュメントは、アツマチプロジェクトの開発を行う際の詳細なガイドです。

## 開発環境のセットアップ

### 前提条件

- Node.js 22.13.0
- pnpm 9.12.0
- MySQL 8.0+
- Expo Go アプリ（iOS/Android）

### 初回セットアップ

```bash
# リポジトリのクローン（Claude Codeの場合は不要）
cd /home/ubuntu/pachislot-event-app

# 依存関係のインストール
pnpm install

# データベースのマイグレーション
pnpm db:push

# 開発サーバーの起動
pnpm dev
```

## プロジェクト構造の詳細

### フロントエンド（app/）

Expo Routerを使用したファイルベースルーティング:

- `app/(tabs)/index.tsx`: 店舗一覧画面（ホーム画面）
- `app/store/[id].tsx`: 店舗詳細画面（動的ルート）
- `app/_layout.tsx`: ルートレイアウト（プロバイダー設定）

### バックエンド（server/）

Express + tRPCを使用したAPIサーバー:

- `server/_core/index.ts`: サーバーのエントリーポイント
- `server/routers.ts`: tRPCルーターの定義
- `server/routers-scraper.ts`: スクレイピングAPI
- `server/routers-actors.ts`: 演者API
- `server/db.ts`: データベース接続

### スクレイピング（server/scrapers/）

複数のソース（10以上の情報サイト）から情報を収集:

- `server/scrapers/index.ts`: スクレイピング統合処理
- `server/scrapers/llm-parser.ts`: LLMパーサー
- `server/scrapers/deduplication-utils.ts`: 重複除去ユーティリティ
- その他、各ソース用のスクレイパーファイル

### ユーティリティ（server/utils/）

- `server/utils/store-url-finder.ts`: 店舗公式URL検索（LLM + ブラウザ検索）

## 開発ワークフロー

### 1. 新機能の追加

```bash
# 1. todo.mdに機能を追加
echo "- [ ] 新機能の説明" >> todo.md

# 2. 機能を実装

# 3. テストを作成
# tests/new-feature.test.ts

# 4. テストを実行
pnpm test tests/new-feature.test.ts

# 5. todo.mdを更新
# - [x] 新機能の説明

# 6. チェックポイントを作成
# Management UI > Code > Save Checkpoint
```

### 2. スクレイピングソースの追加

新しいスクレイピングソースを追加する手順:

1. `server/scrapers/new-source.ts`を作成
2. スクレイピングロジックを実装
3. `server/scrapers/index.ts`にインポートを追加
4. テストを作成して実行
5. ドキュメントを更新

詳細は[スクレイピング仕様](SCRAPING.md)を参照してください。

### 3. APIエンドポイントの追加

新しいAPIエンドポイントを追加する手順:

1. `server/routers.ts`にプロシージャを追加
2. 入力スキーマをZodで定義
3. データベースクエリを実装
4. フロントエンドからtRPCクライアントで呼び出し
5. テストを作成

詳細は[API仕様書](API.md)を参照してください。

## コーディング規約

### TypeScript

- 型定義を明示的に記述する
- `any`型の使用を避ける
- インターフェースよりも型エイリアスを優先

### React Native

- 関数コンポーネントを使用
- Hooksを活用
- `StyleSheet.create()`でスタイルを定義
- NativeWind（Tailwind CSS）を優先的に使用

### tRPC

- プロシージャ名は`camelCase`
- 入力スキーマは必ずZodで定義
- エラーハンドリングを適切に行う

### データベース

- Drizzle ORMを使用
- マイグレーションは`pnpm db:push`で実行
- スキーマ変更は`drizzle/schema.ts`で管理

## テスト

### テストの種類

1. **ユニットテスト**: 個別の関数やコンポーネントのテスト
2. **統合テスト**: APIエンドポイントのテスト
3. **E2Eテスト**: スクレイピングからデータ表示までの一連の流れ

### テストの実行

```bash
# 全テストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test tests/api-connection.test.ts

# ウォッチモード
pnpm test --watch
```

### テストの作成

```typescript
import { describe, it, expect } from "vitest";

describe("Feature Name", () => {
  it("should do something", () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

## デバッグ

### フロントエンドのデバッグ

```typescript
// コンソールログ
console.log("Debug:", data);

// React DevTools
// Expo Goアプリでシェイクして「Debug Remote JS」を選択
```

### バックエンドのデバッグ

```typescript
// サーバーログ
console.log("[DEBUG]", data);

// tRPCエラーログ
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "詳細なエラーメッセージ",
});
```

### データベースのデバッグ

```bash
# データベースの内容を確認
# Management UI > Databaseパネルを使用

# または直接SQLを実行
pnpm tsx -e "import { getDb } from './server/db'; const db = await getDb(); console.log(await db.select().from(stores));"
```

## パフォーマンス最適化

### フロントエンド

- `FlatList`を使用してリストを最適化
- 画像の遅延読み込み
- `useMemo`と`useCallback`でレンダリングを最適化

### バックエンド

- データベースクエリの最適化（インデックスの追加）
- キャッシュの活用
- バッチ処理の実装

### スクレイピング

- 並列処理の活用（ただし過度なリクエストは避ける）
- エラーハンドリングとリトライロジック
- レート制限の実装

## トラブルシューティング

### よくある問題

#### 1. Expo Goで502エラー

**原因**: `EXPO_PUBLIC_API_BASE_URL`が設定されていない

**解決策**:
```bash
# Management UI > Settings > Secretsで確認
# または webdev_edit_secrets ツールで設定
```

#### 2. スクレイピングが失敗する

**原因**: Puppeteerのブラウザが起動しない

**解決策**:
```bash
# サーバーを再起動
pnpm dev
```

#### 3. データベース接続エラー

**原因**: マイグレーションが実行されていない

**解決策**:
```bash
pnpm db:push
```

#### 4. TypeScriptエラー

**原因**: 型定義が古い

**解決策**:
```bash
# 型チェックを実行
pnpm check

# エラーを確認して修正
```

## CI/CD

### チェックポイントの作成

```bash
# Management UIから作成
# または webdev_save_checkpoint ツールを使用
```

### デプロイ

1. チェックポイントを作成
2. Management UI > Publishボタンをクリック
3. デプロイ先のURLが発行される

## 参考リソース

- [Expo Documentation](https://docs.expo.dev/)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Puppeteer Documentation](https://pptr.dev/)

## サポート

問題が発生した場合は、以下の手順で報告してください:

1. エラーメッセージをコピー
2. 再現手順を記録
3. todo.mdにバグとして追加
4. 開発者に報告

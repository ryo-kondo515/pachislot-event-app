# アツマチ - 実装完了サマリー

## プロジェクト概要
パチスロユーザー向けの来店イベント情報集約アプリ「アツマチ」のバックエンドAPI連携とスクレイピング機能を実装しました。

## 実装完了機能

### 1. バックエンドAPI（tRPC）
- **店舗一覧API** (`stores.list`)
  - 店舗情報、イベント情報、演者情報を統合して取得
  - 型安全なAPI通信（TypeScript + tRPC）
  
- **スクレイピングAPI** (`scraper.run`, `scraper.status`)
  - 手動でスクレイピングを実行
  - スクレイピング状態の確認

### 2. スクレイピング機能
- **drillermaguro.com対応**
  - トップページから取材結果一覧を自動取得
  - 店舗名、エリア、イベント日付、イベントタイプを抽出
  - アツさレベルの自動判定
    - マグロ: 5（超アツ）
    - ジャンドリ: 4（アツ）
    - 極上: 4（アツ）
    - あがり: 3（やや熱）
    - 海鮮ドン: 3（やや熱）

- **データベース自動保存**
  - 店舗情報の自動登録
  - イベント情報の自動登録
  - 重複チェック機能

### 3. フロントエンド
- **店舗一覧画面**
  - データベースから店舗情報を取得して表示
  - アツさレベルに応じた色分け表示
  - イベント情報と演者情報の表示

### 4. データベース
- **テーブル構成**
  - `stores`: 店舗情報
  - `events`: イベント情報
  - `actors`: 演者情報
  - `users`: ユーザー情報

## ファイル構成

```
server/
├── scrapers/
│   ├── drillermaguro.ts    # drillermaguro.comスクレイパー
│   └── index.ts            # スクレイピング統合処理
├── routers.ts              # tRPCルーター定義
├── routers-scraper.ts      # スクレイピングAPIルーター
├── db.ts                   # データベース接続
└── scraping-analysis.md    # スクレイピング分析メモ

tests/
├── seed-data.test.ts       # モックデータ投入テスト
└── scraper.test.ts         # スクレイピングテスト

app/(tabs)/
└── index.tsx               # 店舗一覧画面（フロントエンド）
```

## テスト結果

### モックデータ投入テスト
- ✅ 3店舗、2イベント、2演者を正常に投入
- ✅ データベースに正しく保存されることを確認

### スクレイピングテスト
- ✅ スクレイパー実行テスト：成功（5.9秒）
- ✅ 店舗一覧取得テスト：成功（3.4秒）

### 統合テスト
- ✅ フロントエンドとバックエンドの連携確認
- ✅ 店舗一覧が正常に表示されることを確認
- ✅ アツさレベルの色分けが正常に機能することを確認

## 今後の拡張予定

### Phase 1: 他のソースの追加
- [ ] hall-navi.com のスクレイピング実装
- [ ] offme.jp のスクレイピング実装
- [ ] touslo777souko.blog.jp のスクレイピング実装

### Phase 2: 住所・緯度経度の精度向上
- [ ] Google Maps Geocoding API の統合
- [ ] 店舗マスタデータベースの構築

### Phase 3: 演者情報の充実
- [ ] 演者名の自動抽出
- [ ] 演者ランキングアルゴリズムの実装

### Phase 4: 定期実行
- [ ] 1日1回の自動スクレイピング実行
- [ ] スクレイピング結果の通知機能

### Phase 5: 地図機能
- [ ] Google Maps SDKの統合
- [ ] 店舗ピンの表示
- [ ] アツさに応じたピンの色・サイズ変化

## API仕様

### stores.list
**エンドポイント:** `GET /api/trpc/stores.list`

**レスポンス例:**
```json
[
  {
    "id": 1,
    "name": "パチンコ新宿エース",
    "address": "東京都新宿区歌舞伎町1-1-1",
    "latitude": "35.6938",
    "longitude": "139.7036",
    "area": "新宿",
    "machineCount": 800,
    "openingTime": "10:00",
    "closingTime": "23:00",
    "isPremium": 1,
    "events": [
      {
        "id": 1,
        "eventDate": "2026-02-01T00:00:00.000Z",
        "hotLevel": 5,
        "machineType": "バジリスク絆2",
        "description": "超アツイベント！ヤルヲ来店",
        "actor": {
          "id": 1,
          "name": "ヤルヲ"
        }
      }
    ]
  }
]
```

### scraper.run
**エンドポイント:** `POST /api/trpc/scraper.run`

**レスポンス例:**
```json
{
  "success": true,
  "storesAdded": 5,
  "eventsAdded": 12,
  "actorsAdded": 3,
  "errors": []
}
```

## 開発環境

- **フレームワーク:** Expo SDK 54 + React Native
- **バックエンド:** tRPC + Express
- **データベース:** MySQL + Drizzle ORM
- **スクレイピング:** Cheerio + Axios
- **テスト:** Vitest

## 実行方法

### 開発サーバー起動
```bash
pnpm dev
```

### テスト実行
```bash
# モックデータ投入テスト
pnpm test tests/seed-data.test.ts

# スクレイピングテスト
pnpm test tests/scraper.test.ts
```

### スクレイピング手動実行
```bash
curl -X POST http://localhost:3000/api/trpc/scraper.run \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 注意事項

1. **スクレイピングの法的考慮**
   - 各サイトの利用規約を確認してください
   - robots.txtを尊重してください
   - 適切なUser-Agentを設定してください

2. **住所・緯度経度の精度**
   - 現在は簡易的な推測値を使用しています
   - 実際の運用では、Google Maps Geocoding APIなどを使用してください

3. **演者情報**
   - 現在は手動で登録したモックデータのみです
   - 実際のスクレイピングでは、演者名の抽出ロジックが必要です

## ライセンス
MIT License

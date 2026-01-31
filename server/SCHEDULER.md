# スクレイピングスケジューラー

## 概要

このアプリケーションは、パチスロ来店イベント情報を自動的に収集するために、定期実行スケジューラーを実装しています。

## 実装詳細

### スケジュール

- **実行時刻**: 毎日午前3時（日本時間）
- **タイムゾーン**: Asia/Tokyo
- **cron式**: `0 3 * * *`

### 対象サイト

1. **drillermaguro.com** ✅
   - マグロ、ジャンドリ、極上、あがり、海鮮ドンなどの取材情報
   - アツさレベル: 3-5

2. **hall-navi.com** ⚠️
   - 取材情報を店舗単位で取得
   - アツさレベル: 3

3. **offme.jp** ⚠️
   - グラレポ取材、来店イベントなど
   - アツさレベル: 3-5

4. **touslo777souko.blog.jp** ❌
   - 一時無効化（エリア別まとめページのため個別店舗情報が取得できない）

### 実装ファイル

- `server/scheduler.ts`: スケジューラーの実装
- `server/_core/index.ts`: サーバー起動時にスケジューラーを開始
- `server/scrapers/index.ts`: スクレイピング統合ロジック

### 動作確認

スケジューラーが正常に起動すると、以下のログが出力されます：

```
[Scheduler] Daily scraping scheduled at 3:00 AM JST
```

スクレイピング実行時には、以下のログが出力されます：

```
[Scheduler] Starting daily scraping at 2026-01-31T18:00:00.000Z
[Scheduler] Scraping completed successfully: { storesAdded: 10, eventsAdded: 15 }
```

### 開発用スケジューラー

開発環境では、5分ごとにスクレイピングを実行する開発用スケジューラーも用意されています。

使用方法:

```typescript
import { startDevScheduler } from './server/scheduler.js';

// server/_core/index.tsで
startDevScheduler(); // startScheduler()の代わりに使用
```

### 手動実行

スケジューラーを待たずに手動でスクレイピングを実行する場合は、以下のAPIエンドポイントを使用します：

```bash
curl -X POST http://localhost:3000/api/trpc/scraper.run \
  -H "Content-Type: application/json"
```

### トラブルシューティング

**スケジューラーが起動しない場合:**

1. サーバーログを確認する
2. `node-cron`パッケージがインストールされているか確認する
3. タイムゾーン設定が正しいか確認する

**スクレイピングが失敗する場合:**

1. 対象サイトがアクセス可能か確認する
2. HTML構造が変更されていないか確認する
3. データベース接続が正常か確認する

## 今後の改善点

- [ ] スクレイピング失敗時のリトライ機能
- [ ] スクレイピング結果の通知機能
- [ ] スクレイピング履歴の記録
- [ ] 各サイトのスクレイピング精度の向上

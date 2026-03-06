# スクレイピング仕様

このドキュメントは、アツマチプロジェクトのスクレイピング機能の詳細な仕様です。

## 概要

アツマチは、複数のパチスロ情報サイト（10以上）から来店イベント情報を自動収集します。各サイトに対応したスクレイパーを実装し、統一されたデータ形式でデータベースに保存します。

**セキュリティ上の理由により、具体的なスクレイピング先の情報は非公開としています。**

## スクレイピング手法

### 1. 静的HTMLの解析

**実装例**: `server/scrapers/source-*.ts`

**スクレイピング方法**: Cheerio（HTML解析）

**データ抽出の一般的な流れ**:
- 店舗名: HTMLの特定セレクタから取得
- エリア: 地域情報を抽出
- イベント日付: 日付情報をパース
- アツさレベル: イベントタイプや情報の信頼性から判定
  - レベル5: 超アツ（最高評価）
  - レベル4: アツ（高評価）
  - レベル3: やや熱（標準）
  - レベル2: 通常
  - レベル1: 低評価

### 2. 動的コンテンツの解析

**実装例**: `server/scrapers/source-*.ts`

**スクレイピング方法**: Puppeteer + Cheerio（JavaScriptレンダリング対応）

**データ抽出**:
- 演者名: データテーブルから取得
- 店舗名: リスト形式またはテーブル形式から取得
- 都道府県: 地域情報を抽出
- イベント日付: 日付情報をパース

**注意事項**:
- 一部のサイトでは保護機能があるため、Puppeteerを使用
- ページ読み込みに時間がかかる場合がある
- ヘッドレスモードとステルスプラグインを使用

## スクレイピングの実行

### 手動実行

```bash
# スクレイパーを手動実行
pnpm tsx server/run-scraper.ts
```

### 定期実行

現在は手動実行のみ対応。将来的には以下の方法で定期実行を実装予定:

1. **Cronジョブ**: 毎日午前3時に実行
2. **スケジューラー**: `schedule`ツールを使用

## データフロー

```
1. スクレイピング実行
   ↓
2. HTML取得（Puppeteer/Cheerio）
   ↓
3. データ抽出
   ↓
4. データ正規化
   ↓
5. 店舗情報の保存/更新
   ↓
6. イベント情報の保存
   ↓
7. 演者情報の保存
```

## データ正規化

### 店舗名の正規化

```typescript
function normalizeStoreName(name: string): string {
  return name
    .replace(/\s+/g, "")  // 空白を削除
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))  // 全角数字を半角に
    .toLowerCase();
}
```

### 住所の取得

店舗の住所と緯度経度は、LLMを使用して自動取得します:

```typescript
import { invokeLLM } from "../_core/llm";

const result = await invokeLLM({
  messages: [
    {
      role: "user",
      content: `店舗名「${storeName}」のエリア「${area}」から、正確な住所と緯度経度を推測してください。`,
    },
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "store_location",
      schema: {
        type: "object",
        properties: {
          address: { type: "string" },
          latitude: { type: "string" },
          longitude: { type: "string" },
        },
        required: ["address", "latitude", "longitude"],
      },
    },
  },
});
```

### 店舗公式URLの取得

店舗の公式ホームページURLは、LLM + ブラウザ検索で自動取得します:

**実装**: `server/utils/store-url-finder.ts`

**方法**:
1. LLMに店舗名とエリアを渡して公式URLを検索
2. LLMで見つからない場合、ブラウザでGoogle検索を実行
3. 検索結果から公式URLを抽出

```typescript
import { findStoreOfficialUrl } from "../utils/store-url-finder";

const officialUrl = await findStoreOfficialUrl(storeName, area);
```

## エラーハンドリング

### スクレイピングエラー

```typescript
try {
  const events = await scrapeSource();
} catch (error) {
  console.error("[Scraper Error]", error);
  // エラーをログに記録
  // 次のソースに進む
}
```

### データ保存エラー

```typescript
try {
  await db.insert(stores).values(storeData);
} catch (error) {
  if (error.code === "ER_DUP_ENTRY") {
    // 重複エラーの場合は更新
    await db.update(stores).set(storeData).where(eq(stores.name, storeName));
  } else {
    throw error;
  }
}
```

## パフォーマンス最適化

### 並列処理

```typescript
// 複数のソースを並列でスクレイピング
const results = await Promise.allSettled([
  scrapeSource1(),
  scrapeSource2(),
  scrapeSource3(),
  // ... 他のソース
]);
```

### キャッシュ

```typescript
// 店舗情報をキャッシュして重複クエリを削減
const storeCache = new Map<string, number>();

function getOrCreateStore(storeName: string) {
  if (storeCache.has(storeName)) {
    return storeCache.get(storeName);
  }
  const storeId = await createStore(storeName);
  storeCache.set(storeName, storeId);
  return storeId;
}
```

## 新しいスクレイピングソースの追加

### 手順

1. **スクレイパーファイルを作成**

```typescript
// server/scrapers/new-source.ts
import * as cheerio from "cheerio";
import axios from "axios";

export async function scrapeNewSource() {
  const url = "https://example.com/events";
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  const events = [];
  
  $(".event-item").each((i, elem) => {
    const storeName = $(elem).find(".store-name").text().trim();
    const eventDate = $(elem).find(".event-date").text().trim();
    
    events.push({
      storeName,
      eventDate: new Date(eventDate),
      area: "エリア名",
      hotLevel: 3,
    });
  });
  
  return events;
}
```

2. **統合処理に追加**

```typescript
// server/scrapers/index.ts
import { scrapeNewSource } from "./new-source";

export async function runAllScrapers() {
  const results = await Promise.allSettled([
    scrapeSource1(),
    scrapeSource2(),
    scrapeNewSource(),  // 追加
    // ... 他のソース
  ]);

  // ...
}
```

3. **テストを作成**

```typescript
// tests/new-source-scraper.test.ts
import { describe, it, expect } from "vitest";
import { scrapeNewSource } from "../server/scrapers/new-source";

describe("New Source Scraper", () => {
  it("should scrape events from new source", async () => {
    const events = await scrapeNewSource();
    
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("storeName");
    expect(events[0]).toHaveProperty("eventDate");
  });
});
```

4. **ドキュメントを更新**

このファイル（SCRAPING.md）に新しいソースの情報を追加します。

## 法的考慮事項

### robots.txt

各サイトの`robots.txt`を確認し、スクレイピングが許可されているか確認してください。

```bash
# robots.txtを確認
curl https://example.com/robots.txt
```

### User-Agent

適切なUser-Agentを設定してください:

```typescript
const response = await axios.get(url, {
  headers: {
    "User-Agent": "AtsumachiBotBot/1.0 (+https://atsumachi.app/bot)",
  },
});
```

### レート制限

過度なリクエストを避けるため、レート制限を実装してください:

```typescript
import { setTimeout } from "timers/promises";

async function scrapeWithDelay(urls: string[]) {
  for (const url of urls) {
    await scrapeUrl(url);
    await setTimeout(1000);  // 1秒待機
  }
}
```

## トラブルシューティング

### Puppeteerが起動しない

**原因**: ブラウザのバイナリが見つからない

**解決策**:
```bash
# Puppeteerを再インストール
pnpm add -D puppeteer
```

### Cloudflareにブロックされる

**原因**: ボット検出

**解決策**:
- Puppeteerを使用
- ヘッドレスモードを無効化
- User-Agentを変更

### データが取得できない

**原因**: サイトの構造が変更された

**解決策**:
1. ブラウザでサイトを開いて構造を確認
2. セレクターを更新
3. テストを実行して確認

## 参考リソース

- [Cheerio Documentation](https://cheerio.js.org/)
- [Puppeteer Documentation](https://pptr.dev/)
- [Axios Documentation](https://axios-http.com/)

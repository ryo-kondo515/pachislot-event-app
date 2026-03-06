# バックエンド技術スタック

このドキュメントでは、アツマチプロジェクトのバックエンド実装について詳しく解説します。

## 目次

- [技術スタック概要](#技術スタック概要)
- [アーキテクチャ](#アーキテクチャ)
- [データベース](#データベース)
- [スクレイピングシステム](#スクレイピングシステム)
- [認証システム](#認証システム)
- [ジオコーディング](#ジオコーディング)
- [ランキング計算](#ランキング計算)
- [スケジューラ](#スケジューラ)
- [tRPC型安全なAPI](#trpc型安全なapi)
- [デプロイ環境](#デプロイ環境)

## 技術スタック概要

### コア技術

| 技術 | バージョン | 用途 |
|-----|----------|------|
| Node.js | 22.13.0+ | ランタイム環境 |
| TypeScript | 5.9.3 | 型安全な開発 |
| Express | 4.22.1 | HTTPサーバー |
| tRPC | 11.7.2 | 型安全なAPI |

### データベース

- **PostgreSQL** 14+: リレーショナルデータベース
- **Drizzle ORM** 0.44.7: TypeScript ORMライブラリ
- **Supabase**: PostgreSQLホスティング + 認証サービス

### スクレイピング

- **Puppeteer** 24.36.1: ヘッドレスブラウザ自動化
- **Cheerio** 1.2.0: HTMLパーサー
- **Axios** 1.13.2: HTTPクライアント

### 外部API

- **Google Geocoding API**: 住所から緯度経度を取得
- **LLM API** (Gemini/Built-in Forge): イベント情報の自動抽出

### その他

- **node-cron** 4.2.1: スケジュールタスク実行
- **Zod** 4.2.1: スキーマバリデーション
- **SuperJSON** 1.13.3: 型保持データシリアライゼーション

## アーキテクチャ

### ディレクトリ構造

```
server/
├── _core/                        # コア機能
│   ├── index.ts                  # サーバーエントリーポイント
│   ├── trpc.ts                   # tRPC設定
│   ├── context.ts                # リクエストコンテキスト
│   ├── env.ts                    # 環境変数
│   └── supabase.ts               # Supabase管理クライアント
├── scrapers/                     # スクレイピング
│   ├── index.ts                  # スクレイパー統合
│   ├── llm-parser.ts             # LLMパーサー
│   ├── deduplication-utils.ts    # 重複除去
│   ├── cleanup-past-events.ts    # 過去イベント削除
│   ├── drillermaguro.ts          # 各ソーススクレイパー
│   ├── hallnavi.ts
│   ├── pworld.ts
│   └── ...                       # その他10以上のソース
├── utils/                        # ユーティリティ
│   └── store-url-finder.ts       # 店舗公式URL検索
├── routers.ts                    # メインtRPCルーター
├── routers-actors.ts             # 演者APIルーター
├── routers-scraper.ts            # スクレイピングAPIルーター
├── db-postgres.ts                # データベース接続
├── geocoding.ts                  # ジオコーディング
├── ranking.ts                    # ランキング計算
├── scheduler.ts                  # 定期実行タスク
├── run-scraper.ts                # スクレイパー手動実行
└── update-geocoding.ts           # ジオコーディング更新
```

### データフロー

```
1. スクレイピング
   複数ソース → Puppeteer/Cheerio → LLM解析 → データベース

2. クライアントリクエスト
   クライアント → tRPC → コンテキスト作成 → 認証確認 → データ取得 → レスポンス

3. 定期タスク
   node-cron → スクレイピング実行 → ランキング計算 → データ更新
```

## データベース

### PostgreSQL + Drizzle ORM

#### 接続設定

```typescript
// server/db-postgres.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrlPostgres) {
    try {
      const pool = new Pool({
        connectionString: ENV.databaseUrlPostgres,
        ssl: ENV.isProduction ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle({ client: pool });
    } catch (error) {
      console.warn("[Database] Failed to connect to PostgreSQL:", error);
      _db = null;
    }
  }
  return _db;
}
```

#### スキーマ定義

```typescript
// drizzle/schema-postgres.ts
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  machineCount: integer("machineCount").notNull(),
  openingTime: varchar("openingTime", { length: 10 }),
  closingTime: varchar("closingTime", { length: 10 }),
  isPremium: integer("isPremium").default(0).notNull(),
  sourceUrl: text("sourceUrl"),
  officialUrl: text("officialUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  actorId: integer("actorId"),
  eventDate: timestamp("eventDate", { withTimezone: true }).notNull(),
  hotLevel: integer("hotLevel").notNull(),
  machineType: varchar("machineType", { length: 255 }),
  description: text("description"),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const actors = pgTable("actors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  rankScore: integer("rankScore").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUuid: varchar("supabaseUuid", { length: 36 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});
```

#### クエリ例

```typescript
// 店舗一覧取得
const storesList = await db.select().from(stores);

// 条件付き取得
const store = await db
  .select()
  .from(stores)
  .where(eq(stores.id, storeId))
  .limit(1);

// INSERT
await db.insert(stores).values({
  name: "店舗名",
  address: "住所",
  latitude: "35.6895",
  longitude: "139.6917",
  area: "東京",
  machineCount: 500,
});

// UPDATE
await db
  .update(actors)
  .set({ rankScore: 150 })
  .where(eq(actors.id, actorId));
```

#### マイグレーション

```bash
# スキーマからマイグレーションファイルを生成
pnpm drizzle-kit generate

# マイグレーションを実行
pnpm drizzle-kit migrate

# Drizzle Studioでデータベースを確認
pnpm drizzle-kit studio
```

## スクレイピングシステム

### アーキテクチャ

複数のソースサイトから自動的にイベント情報を収集するシステム。

#### 対応ソース（10以上）

- drillermaguro.com
- hallnavi.jp
- offme.jp
- touslo.jp
- raiten-ex.net
- hisshobon.com
- janbari.com
- slopachistation.com
- dmm-pachitown.com
- p-world.co.jp

### スクレイピングフロー

```typescript
// server/scrapers/index.ts
export async function runAllScrapers(): Promise<ScrapingResult> {
  // 1. 過去のイベントを削除
  await cleanupPastEvents();

  // 2. 全ソースからイベントを収集
  const allEvents: Array<ScrapedEvent> = [];

  // 各ソースをスクレイピング
  const drillerEvents = await scrapeDrillerMaguro();
  allEvents.push(...drillerEvents);

  const hallNaviEvents = await scrapeHallNavi();
  allEvents.push(...hallNaviEvents);

  // ... 他のソース

  // 3. 重複除去
  const deduplicatedEvents = deduplicateEvents(allEvents);

  // 4. データベースに保存
  for (const event of deduplicatedEvents) {
    // 店舗を検索または作成
    let store = await findStore(event.storeName, event.area);
    if (!store) {
      // ジオコーディング
      const geoData = await geocodeStore(event.storeName, event.area);

      // 店舗公式URL検索
      const officialUrl = await findStoreOfficialUrl(event.storeName, event.area);

      // 店舗を作成
      store = await createStore({ ...event, ...geoData, officialUrl });
    }

    // 演者を検索または作成
    let actor = null;
    if (event.actorName) {
      actor = await findOrCreateActor(event.actorName);
    }

    // イベントを作成
    await createEvent({
      storeId: store.id,
      actorId: actor?.id,
      eventDate: event.date,
      hotLevel: event.hotLevel,
      machineType: event.machineType,
      description: event.description,
      sourceUrl: event.sourceUrl,
    });
  }

  return result;
}
```

### LLMによるイベント情報抽出

```typescript
// server/scrapers/llm-parser.ts
export async function parseSlopachi(htmlContent: string) {
  const prompt = `以下のHTMLからパチンコ店の来店イベント情報を抽出してください...`;

  const result = await invokeLLM({
    messages: [{ role: 'user', content: prompt }],
  });

  const events = JSON.parse(result.choices[0].message.content);
  return events;
}
```

### 重複除去

```typescript
// server/scrapers/deduplication-utils.ts
export function deduplicateEvents(events: ScrapedEvent[]): ScrapedEvent[] {
  const uniqueEvents = new Map<string, ScrapedEvent>();

  for (const event of events) {
    // 正規化
    const normalizedStoreName = normalizeStoreName(event.storeName);
    const normalizedDate = normalizeDate(event.date);

    // ユニークキーを生成
    const key = `${normalizedStoreName}_${normalizedDate}_${event.actorName || 'no-actor'}`;

    // 重複チェック
    if (!uniqueEvents.has(key)) {
      uniqueEvents.set(key, event);
    } else {
      // より信頼性の高いソースを優先
      const existing = uniqueEvents.get(key)!;
      if (getSourcePriority(event.source) > getSourcePriority(existing.source)) {
        uniqueEvents.set(key, event);
      }
    }
  }

  return Array.from(uniqueEvents.values());
}
```

## 認証システム

### Supabase Auth (サーバー側)

#### 管理クライアント設定

```typescript
// server/_core/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,  // 管理者キー
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

#### コンテキストでの認証

```typescript
// server/_core/context.ts
export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = extractBearerToken(opts.req);
    if (token) {
      // Supabase JWTトークンを検証
      const { data: { user: supabaseUser }, error } =
        await supabaseAdmin.auth.getUser(token);

      if (!error && supabaseUser) {
        // データベースからユーザー情報を取得
        user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;

        // ユーザーが存在しない場合は作成
        if (!user) {
          await upsertUser({
            supabaseUuid: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email || null,
            email: supabaseUser.email || null,
            loginMethod: supabaseUser.app_metadata?.provider || null,
            lastSignedIn: new Date(),
          });
          user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;
        }
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
```

#### 認証ミドルウェア

```typescript
// server/_core/trpc.ts
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "認証が必要です" });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "管理者権限が必要です" });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  })
);
```

## ジオコーディング

住所から緯度経度を取得する機能。

### Google Places API

```typescript
// server/geocoding.ts
async function geocodeWithGooglePlaces(storeName: string, area: string) {
  const query = `${storeName} ${area} パチンコ`;
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await axios.post(
    url,
    {
      textQuery: query,
      languageCode: "ja",
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": ENV.googleMapsApiKey,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
      },
    }
  );

  const place = response.data.places?.[0];
  if (place?.location) {
    return {
      latitude: place.location.latitude.toString(),
      longitude: place.location.longitude.toString(),
      address: place.formattedAddress,
    };
  }

  return null;
}
```

### LLMフォールバック

Google APIが利用できない場合、LLMで推測します。

```typescript
export async function geocodeStore(storeName: string, area: string) {
  // Google Places APIを試行
  if (ENV.googleMapsApiKey) {
    const placesResult = await geocodeWithGooglePlaces(storeName, area);
    if (placesResult) return placesResult;
  }

  // LLMで推測
  const prompt = `以下のパチンコ店の正確な住所と緯度経度を推測してください。
店舗名: ${storeName}
エリア: ${area}

以下のJSON形式で回答してください：
{
  "address": "都道府県市区町村番地を含む正確な住所",
  "latitude": "緯度（小数点6桁）",
  "longitude": "経度（小数点6桁）"
}`;

  const result = await invokeLLM({ messages: [{ role: 'user', content: prompt }] });
  const data = JSON.parse(result.choices[0].message.content);

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    address: data.address,
  };
}
```

## ランキング計算

演者の人気度をスコア化するシステム。

### スコア計算ロジック

```typescript
// server/ranking.ts
export async function calculateActorRankings() {
  const db = await getDb();

  // 演者ごとの統計を集計
  const actorStats = await db
    .select({
      actorId: events.actorId,
      eventCount: sql<number>`COUNT(*)`,
      latestEventDate: sql<Date>`MAX(${events.eventDate})`,
    })
    .from(events)
    .where(sql`${events.actorId} IS NOT NULL`)
    .groupBy(events.actorId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (const stats of actorStats) {
    let rankScore = 100;  // 基本スコア

    // 来店頻度スコア（1イベント = 10ポイント）
    rankScore += stats.eventCount * 10;

    // 最近の来店スコア
    const latestDate = new Date(stats.latestEventDate);
    if (latestDate >= thirtyDaysAgo) {
      rankScore += 20;  // 30日以内
    } else if (latestDate >= sixtyDaysAgo) {
      rankScore += 10;  // 60日以内
    }

    // データベースを更新
    await db
      .update(actors)
      .set({ rankScore })
      .where(eq(actors.id, stats.actorId));
  }

  return {
    success: true,
    actorsUpdated: actorStats.length,
  };
}
```

### ランキング取得

```typescript
export async function getActorRankings(limit: number = 10) {
  const db = await getDb();

  const rankings = await db
    .select({
      id: actors.id,
      name: actors.name,
      rankScore: actors.rankScore,
      imageUrl: actors.imageUrl,
    })
    .from(actors)
    .orderBy(sql`${actors.rankScore} DESC`)
    .limit(limit);

  // 各演者の来店回数を取得
  const rankingsWithStats = await Promise.all(
    rankings.map(async (actor) => {
      const eventCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(eq(events.actorId, actor.id));

      return {
        ...actor,
        eventCount: eventCount[0]?.count || 0,
      };
    })
  );

  return rankingsWithStats;
}
```

## スケジューラ

定期的なタスク実行を管理。

### 定期スクレイピング

```typescript
// server/scheduler.ts
import cron from 'node-cron';

export function startScheduler() {
  // 毎日午前0時1分に実行（日本時間）
  const task = cron.schedule('1 0 * * *', async () => {
    console.log('[Scheduler] Starting daily scraping');

    try {
      // スクレイピング実行
      const result = await runAllScrapers();
      console.log('[Scheduler] Scraping completed:', result);

      // 演者ランキング再計算
      const rankingResult = await calculateActorRankings();
      console.log('[Scheduler] Rankings calculated:', rankingResult);
    } catch (error) {
      console.error('[Scheduler] Daily job failed:', error);
    }
  }, {
    timezone: 'Asia/Tokyo'
  });

  task.start();
  console.log('[Scheduler] Daily scraping scheduled at 0:01 AM JST');

  return task;
}
```

### GitHub Actions統合

```yaml
# .github/workflows/scraping.yml
name: Daily Scraping

on:
  schedule:
    - cron: '1 15 * * *'  # 0:01 JST (15:01 UTC)
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22.13.0'

      - name: Install dependencies
        run: pnpm install

      - name: Run scraper
        run: pnpm tsx server/run-scraper.ts
        env:
          DATABASE_URL_POSTGRES: ${{ secrets.DATABASE_URL_POSTGRES }}
          GOOGLE_MAPS_API_KEY: ${{ secrets.GOOGLE_MAPS_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## tRPC型安全なAPI

## 従来のREST APIとの違い

### 従来のREST API

```typescript
// サーバー側
app.get('/api/stores', (req, res) => {
  const stores = getStores();
  res.json(stores);
});

// クライアント側
const response = await fetch('/api/stores');
const stores = await response.json(); // 型情報が失われる!
// stores の型は any または unknown
```

**問題点:**
- 型情報が失われる
- APIの変更がコンパイルエラーとして検出されない
- 手動で型定義を同期する必要がある

### tRPCの場合

```typescript
// サーバー側 (server/routers.ts)
stores: router({
  listByRegion: publicProcedure
    .input(z.object({ prefectures: z.array(z.string()) }))
    .query(async ({ input }) => {
      // ... データ取得ロジック
      return result; // 型情報が保持される
    }),
})

// クライアント側 (app/(tabs)/index.tsx)
const { data } = trpc.stores.listByRegion.useQuery(
  { prefectures: ['東京都', '神奈川県'] }
);
// data は完全に型付けされている!
// TypeScriptの自動補完が効く
```

**利点:**
- エンドツーエンドで型が保証される
- APIの変更が即座にコンパイルエラーとして検出される
- 型定義の同期が不要

## 型安全性の実現方法

### サーバー側の型定義

```typescript
// server/routers.ts:304
export const appRouter = router({
  auth: router({ ... }),
  stores: router({ ... }),
  events: router({ ... }),
  actors: actorsRouter,
  scraper: scraperRouter,
});

// ← この型エクスポートが重要!
export type AppRouter = typeof appRouter;
```

`AppRouter`型がクライアントに共有され、すべてのAPIエンドポイントの型情報を含みます。

### クライアント側での型インポート

```typescript
// lib/trpc.ts:4
import type { AppRouter } from "@/server/routers";

// lib/trpc.ts:15
export const trpc = createTRPCReact<AppRouter>();
```

`AppRouter`型をジェネリクスで渡すことで、クライアントがサーバーのAPI構造を完全に認識します。

## 具体的な使用例

### サーバー側: APIエンドポイントの定義

```typescript
// server/routers.ts:98-165
stores: router({
  detail: publicProcedure
    .input(z.object({ storeId: z.number() })) // ← 入力のスキーマ定義
    .query(async ({ input }) => {
      const db = await getDb();

      // 店舗情報を取得
      const storeList = await db
        .select()
        .from(stores)
        .where(eq(stores.id, input.storeId))
        .limit(1);

      // ... イベント情報などを追加

      return {
        ...store,
        events: eventsWithActors,  // ← 戻り値の型が自動推論される
      };
    }),
})
```

**ポイント:**
- `input()`: Zodスキーマでバリデーション + 型定義を同時に行う
- 戻り値の型は自動的に推論される
- ランタイムバリデーションとコンパイル時の型チェックを両立

### クライアント側: 型安全な呼び出し

```typescript
// app/store/[id].tsx:20
const { data: storeDetail, isLoading, error } = trpc.stores.detail.useQuery(
  { storeId: 123 }
);

// ✅ TypeScriptが自動補完してくれる:
storeDetail.name
storeDetail.address
storeDetail.events[0].actor?.name

// ❌ コンパイルエラーになる:
trpc.stores.detail.useQuery({ wrongParam: 123 })  // パラメータ名が間違っている
storeDetail.nonExistentField  // 存在しないフィールド
```

## 主な機能と仕組み

### プロシージャの種類

```typescript
// server/_core/trpc.ts:11-28
export const publicProcedure = t.procedure;         // 誰でも実行可能
export const protectedProcedure = t.procedure.use(requireUser); // 認証必須
export const adminProcedure = t.procedure.use(...); // 管理者のみ
```

- **publicProcedure**: 認証不要のAPI（店舗一覧取得など）
- **protectedProcedure**: ログインユーザーのみ実行可能
- **adminProcedure**: 管理者のみ実行可能

### ミドルウェアによる認証

```typescript
// server/_core/trpc.ts:13-26
const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});
```

ミドルウェアで認証チェックを一元管理し、protectedProcedureで再利用できます。

### コンテキスト（認証情報の受け渡し）

#### サーバー側: コンテキストの作成

```typescript
// server/_core/context.ts:12-47
export async function createContext(opts: CreateExpressContextOptions) {
  let user: User | null = null;

  try {
    const token = extractBearerToken(opts.req);
    if (token) {
      // Supabase JWTトークンを検証
      const { data: { user: supabaseUser } } = await supabaseAdmin.auth.getUser(token);

      if (!error && supabaseUser) {
        // データベースからユーザー情報を取得
        user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;

        // ユーザーが存在しない場合は作成
        if (!user) {
          await upsertUser({
            supabaseUuid: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email || null,
            email: supabaseUser.email || null,
            loginMethod: supabaseUser.app_metadata?.provider || null,
            lastSignedIn: new Date(),
          });
          user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;
        }
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,  // すべてのプロシージャで利用可能
  };
}
```

#### クライアント側: トークンの自動付与

```typescript
// lib/trpc.ts:28-31
httpBatchLink({
  url: `${getApiBaseUrl()}/api/trpc`,
  transformer: superjson,
  async headers() {
    const { data: { session } } = await supabase.auth.getSession();
    return session ? { Authorization: `Bearer ${session.access_token}` } : {};
  },
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
})
```

すべてのAPI呼び出しに自動的に認証トークンが付与されます。

### SuperJSONによるデータシリアライゼーション

```typescript
// server/_core/trpc.ts:7
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson, // ← Date、Set、Mapなども送信可能
});

// lib/trpc.ts:27
httpBatchLink({
  transformer: superjson, // ← クライアント側も同じ設定
})
```

**SuperJSONの利点:**
- `Date`オブジェクトをそのまま送受信可能（文字列変換不要）
- `undefined`, `Map`, `Set`, `BigInt` などの複雑な型も扱える
- 通常のJSONでは表現できないデータ型を安全に送信

**使用例:**
```typescript
// サーバー側
return {
  store: storeData,
  event: {
    eventDate: new Date('2026-03-07'), // Dateオブジェクトのまま返せる
  }
};

// クライアント側
const { data } = trpc.stores.detail.useQuery({ storeId: 1 });
data.event.eventDate.getFullYear(); // Date型のメソッドが使える!
```

## 実際の通信フロー

```
クライアント → サーバー
────────────────────────────

1. クライアント: API呼び出し
   trpc.stores.detail.useQuery({ storeId: 123 })
   ↓

2. HTTPリクエスト送信
   POST /api/trpc/stores.detail
   Body: { storeId: 123 }
   Headers: { Authorization: "Bearer <token>" }
   ↓

3. サーバー: コンテキスト作成
   createContext() でトークン検証 → user情報取得
   ↓

4. サーバー: プロシージャ実行
   publicProcedure.query() 実行
   ↓

5. サーバー: データベースクエリ実行
   Drizzle ORMでPostgreSQLからデータ取得
   ↓

6. サーバー: レスポンス返却
   SuperJSONでシリアライズして返却
   ↓

7. クライアント: データ受信
   型付きデータとして受信（自動補完が効く）
```

## APIルーター構成

```typescript
// server/routers.ts
export const appRouter = router({
  system: systemRouter,      // ヘルスチェックなど
  auth: router({             // 認証関連
    me: ...,                 // ログインユーザー情報取得
    logout: ...,             // ログアウト
  }),
  stores: router({           // 店舗関連
    list: ...,               // 全店舗一覧
    listByRegion: ...,       // 地域別店舗一覧
    detail: ...,             // 店舗詳細
  }),
  events: router({           // イベント関連
    list: ...,               // イベント一覧
  }),
  actors: actorsRouter,      // 演者関連
  scraper: scraperRouter,    // スクレイピング関連（管理者のみ）
});
```

## tRPCのメリット

### ✅ エンドツーエンドの型安全性
- サーバーの変更がクライアントのTypeScriptエラーとして即座に検出される
- APIの仕様書が不要（型定義がドキュメントの役割を果たす）
- リファクタリングが安全に行える

### ✅ 自動補完とリファクタリング
- IDEが完全にサポート
- 関数名や型の変更時に一括置換が安全に実行できる
- タイポによるバグを防げる

### ✅ バリデーション統合
- Zodスキーマで入力検証と型定義を同時に行える
- ランタイムバリデーションとコンパイル時の型チェックを両立
- 不正なデータの混入を防ぐ

### ✅ React Queryとの統合
- キャッシング、再取得、楽観的更新などが簡単
- ローディング状態、エラーハンドリングが統一的に扱える
- 自動的な背景更新とデータ同期

### ✅ 開発速度の向上
- REST APIのようなエンドポイント設計が不要
- 型エラーで多くのバグを事前に防げる
- フロントエンドとバックエンドの開発体験が統一される

## デプロイ環境

### プラットフォーム

- **ホスティング**: Railway
- **データベース**: Supabase PostgreSQL
- **定期実行**: GitHub Actions (現在無効化中)

### 環境変数

```bash
# データベース
DATABASE_URL_POSTGRES=postgresql://user:password@host:5432/dbname

# Supabase認証
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# LLM API
GEMINI_API_KEY=your-gemini-api-key
BUILT_IN_FORGE_API_KEY=your-llm-api-key
BUILT_IN_FORGE_API_URL=https://your-llm-api-endpoint

# 環境
NODE_ENV=production
TZ=Asia/Tokyo
```

### デプロイ手順

```bash
# 1. ビルド
pnpm build

# 2. 本番環境で起動
NODE_ENV=production node dist/index.js
```

## パフォーマンス最適化

### データベース最適化

```typescript
// インデックスの追加
CREATE INDEX idx_events_store_id ON events(storeId);
CREATE INDEX idx_events_actor_id ON events(actorId);
CREATE INDEX idx_events_date ON events(eventDate);
CREATE INDEX idx_stores_area ON stores(area);
```

### キャッシュ戦略

```typescript
// React Queryのキャッシュ（クライアント側）
const { data } = trpc.stores.list.useQuery(undefined, {
  staleTime: 60000,      // 1分間はキャッシュを新鮮と見なす
  cacheTime: 300000,     // 5分間メモリに保持
  refetchOnMount: false, // マウント時の再取得を無効化
});
```

### バッチリクエスト

tRPCは自動的に複数のリクエストをバッチ処理します。

```typescript
// 以下の2つのクエリは1つのHTTPリクエストにまとめられる
const stores = trpc.stores.list.useQuery();
const events = trpc.events.list.useQuery();
```

## セキュリティ

### 認証・認可

- **JWT認証**: Supabase Authによる安全なトークン管理
- **ロールベースアクセス制御**: user/adminロールの実装
- **HTTPSのみ**: 本番環境ではHTTPS必須

### データ保護

```typescript
// パスワードは保存しない（Supabase Authが管理）
// セッショントークンは自動更新
// 管理者操作はadminProcedureで保護

adminProcedure.mutation(async ({ ctx }) => {
  // ctx.user.role === "admin" が保証されている
  // ...管理者のみの操作
});
```

### 入力バリデーション

```typescript
// Zodスキーマによる厳格なバリデーション
publicProcedure
  .input(z.object({
    storeId: z.number().int().positive(),
    eventDate: z.date(),
    hotLevel: z.number().int().min(1).max(5),
  }))
  .mutation(async ({ input }) => {
    // inputは型安全かつバリデーション済み
  });
```

## エラーハンドリング

### tRPCエラー

```typescript
import { TRPCError } from "@trpc/server";

// エラーを投げる
throw new TRPCError({
  code: "NOT_FOUND",
  message: "店舗が見つかりません",
});

// エラーコード
// - BAD_REQUEST: 不正なリクエスト
// - UNAUTHORIZED: 認証エラー
// - FORBIDDEN: 権限エラー
// - NOT_FOUND: リソースが見つからない
// - INTERNAL_SERVER_ERROR: サーバーエラー
```

### データベースエラー

```typescript
try {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(stores).values(storeData);
} catch (error) {
  console.error("[Database] Insert failed:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "データベースエラーが発生しました",
  });
}
```

## ロギング

### ログレベル

```typescript
// 情報ログ
console.log("[Scraper] Starting scraping...");

// 警告ログ
console.warn("[Database] Retrying connection...");

// エラーログ
console.error("[API] Request failed:", error);
```

### 構造化ログ

```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: "info",
  service: "scraper",
  message: "Scraping completed",
  data: {
    storesAdded: 10,
    eventsAdded: 50,
    duration: 120000,
  },
}));
```

## テスト

### 単体テスト

```typescript
// tests/api-connection.test.ts
import { describe, it, expect } from "vitest";

describe("Store API", () => {
  it("should fetch stores list", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/stores.list");
    const data = await response.json();

    expect(data.result.data).toBeDefined();
    expect(Array.isArray(data.result.data.json)).toBe(true);
  });
});
```

### スクレイピングテスト

```bash
# 特定のスクレイパーをテスト
pnpm tsx tests/test-pworld.ts

# 全スクレイパーをテスト
pnpm tsx tests/test-all-new-scrapers.ts
```

## まとめ

このバックエンドアーキテクチャは以下の特徴を持ちます：

### ✅ 主要機能

1. **型安全なAPI**: tRPC + TypeScriptによるエンドツーエンドの型安全性
2. **自動データ収集**: 10以上のソースから自動スクレイピング
3. **AI統合**: LLMによる高精度なイベント情報抽出
4. **認証システム**: Supabase Authによる安全な認証
5. **ジオコーディング**: Google APIとLLMの組み合わせ
6. **ランキング**: 演者の人気度を自動計算
7. **スケジューラ**: 毎日自動実行される定期タスク

### ✅ 技術的利点

- **型安全性**: コンパイル時のエラー検出
- **スケーラビリティ**: PostgreSQL + Drizzle ORMの高いパフォーマンス
- **保守性**: 明確な責任分離とモジュール化
- **拡張性**: 新しいスクレイピングソースの追加が容易
- **セキュリティ**: JWT認証とロールベースアクセス制御

### ✅ 開発体験

- **自動補完**: IDEの完全なサポート
- **ホットリロード**: 開発サーバーの自動再起動
- **型推論**: 明示的な型定義が不要
- **バリデーション**: Zodによる厳格な入力検証

## 参考資料

- [tRPC公式ドキュメント](https://trpc.io/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Puppeteer公式ドキュメント](https://pptr.dev/)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Zod公式ドキュメント](https://zod.dev/)
- [node-cron公式ドキュメント](https://github.com/node-cron/node-cron)

## 関連ドキュメント

- [フロントエンド技術スタック](./FRONTEND.md)
- [API仕様書](./API.md)
- [スクレイピング仕様](./SCRAPING.md)
- [開発者ガイド](./DEVELOPMENT.md)

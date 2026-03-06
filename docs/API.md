# API仕様書

このドキュメントは、アツマチプロジェクトのtRPC APIの詳細な仕様です。

## 概要

アツマチのバックエンドAPIは、tRPCを使用して型安全なAPI通信を実現しています。フロントエンドからは、tRPCクライアントを通じて自動補完とエラーチェックが可能です。

## デプロイ環境

- **開発環境**: ローカル (localhost:3000)
- **本番環境**: Railway
- **データベース**: Supabase PostgreSQL

## ベースURL

- **開発環境**: `http://localhost:3000/api/trpc`
- **本番環境**: 環境変数 `EXPO_PUBLIC_API_BASE_URL` で設定

## 認証

Supabase Authを使用したJWT認証を実装済みです。

- **認証方法**: Bearer Token (Supabase JWT)
- **認証が必要なエンドポイント**: 現在はすべて`publicProcedure`で認証不要ですが、将来的に`protectedProcedure`や`adminProcedure`を使用するエンドポイントが追加される可能性があります
- **トークンの取得**: Supabase Auth経由で自動的に処理されます

### 認証フロー

1. クライアントがSupabase Authでログイン
2. tRPCクライアントが自動的にトークンをヘッダーに付与
3. サーバー側でトークンを検証し、ユーザー情報を取得
4. コンテキストに`user`情報が設定される

## エンドポイント一覧

### 概要

| カテゴリ | エンドポイント | メソッド | 説明 |
|---------|---------------|---------|------|
| 店舗 | `stores.list` | query | 当日のイベントがある全店舗一覧 |
| 店舗 | `stores.listByRegion` | query | 地域別の店舗一覧 |
| 店舗 | `stores.detail` | query | 店舗詳細情報 |
| イベント | `events.list` | query | 今日以降のイベント一覧 |
| 演者 | `actors.list` | query | 演者一覧（ランキング付き） |
| 演者 | `actors.getById` | query | 演者詳細情報 |
| 演者 | `actors.rankings` | query | 演者ランキング取得 |
| 演者 | `actors.calculateRankings` | mutation | ランキングスコア再計算 |
| スクレイピング | `scraper.run` | mutation | スクレイピング手動実行 |
| スクレイピング | `scraper.status` | query | スクレイピング状態取得 |
| 認証 | `auth.me` | query | ログインユーザー情報取得 |
| 認証 | `auth.logout` | mutation | ログアウト |
| システム | `system.health` | query | ヘルスチェック |

### 店舗関連

#### `stores.list`

当日のイベントがある全店舗一覧を取得します。

**メソッド**: `query` (GET相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type StoresListResponse = Array<{
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  area: string;
  machineCount: number;
  openingTime: string | null;
  closingTime: string | null;
  isPremium: number;
  officialUrl: string | null;
  sourceUrl: string | null;
  events: Array<{
    id: number;
    storeId: number;
    eventDate: Date;
    hotLevel: number;
    machineType: string | null;
    description: string | null;
    sourceUrl: string | null;
    actorId: number | null;
    actor: {
      id: number;
      name: string;
      imageUrl: string | null;
      rankScore: number;
    } | null;
  }>;
}>;
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function StoresList() {
  const { data: stores, isLoading } = trpc.stores.list.useQuery();
  
  if (isLoading) return <Text>読み込み中...</Text>;
  
  return (
    <FlatList
      data={stores}
      renderItem={({ item }) => <StoreCard store={item} />}
    />
  );
}
```

**cURLでのテスト**:

```bash
curl -s 'http://localhost:3000/api/trpc/stores.list' | jq
```

#### `stores.listByRegion`

指定された地域（都道府県）の、当日イベントがある店舗一覧を取得します。

**メソッド**: `query` (GET相当)

**パラメータ**:

```typescript
{
  prefectures: string[];  // 都道府県名の配列（例: ['東京都', '神奈川県']）
}
```

**レスポンス**:

```typescript
type StoresListByRegionResponse = Array<{
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  area: string;
  machineCount: number;
  openingTime: string | null;
  closingTime: string | null;
  isPremium: number;
  officialUrl: string | null;
  sourceUrl: string | null;
  events: Array<{
    id: number;
    storeId: number;
    eventDate: Date;
    hotLevel: number;
    machineType: string | null;
    description: string | null;
    sourceUrl: string | null;
    actorId: number | null;
    actor: {
      id: number;
      name: string;
      imageUrl: string | null;
      rankScore: number;
    } | null;
  }>;
}>;
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function KantoStoresList() {
  const { data: stores, isLoading } = trpc.stores.listByRegion.useQuery({
    prefectures: ['東京都', '神奈川県', '埼玉県', '千葉県']
  });

  if (isLoading) return <Text>読み込み中...</Text>;

  return (
    <FlatList
      data={stores}
      renderItem={({ item }) => <StoreCard store={item} />}
    />
  );
}
```

#### `stores.detail`

店舗の詳細情報を取得します（当日のイベント情報を含む）。

**メソッド**: `query` (GET相当)

**パラメータ**:

```typescript
{
  storeId: number;
}
```

**レスポンス**:

```typescript
type StoreDetailResponse = {
  id: number;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  area: string;
  machineCount: number | null;
  openingTime: string | null;
  closingTime: string | null;
  isPremium: number;
  officialUrl: string | null;
  sourceUrl: string | null;
  events: Array<{
    id: number;
    storeId: number;
    eventDate: Date;
    hotLevel: number;
    machineType: string | null;
    description: string | null;
    sourceUrl: string | null;
    actorId: number | null;
    actor: {
      id: number;
      name: string;
      imageUrl: string | null;
      rankScore: number;
    } | null;
  }>;
} | null;
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams } from "expo-router";

function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = parseInt(id, 10);
  
  const { data: store, isLoading } = trpc.stores.detail.useQuery({ storeId });
  
  if (isLoading) return <Text>読み込み中...</Text>;
  if (!store) return <Text>店舗が見つかりません</Text>;
  
  return (
    <View>
      <Text>{store.name}</Text>
      <Text>{store.address}</Text>
    </View>
  );
}
```

**cURLでのテスト**:

```bash
curl -s 'http://localhost:3000/api/trpc/stores.detail?batch=1&input=%7B%220%22%3A%7B%22storeId%22%3A1%7D%7D' | jq
```

### イベント関連

#### `events.list`

今日以降のイベント一覧を取得します（店舗情報と演者情報を含む）。

**メソッド**: `query` (GET相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type EventsListResponse = Array<{
  id: number;
  storeId: number;
  actorId: number | null;
  eventDate: Date;
  hotLevel: number;
  machineType: string | null;
  description: string | null;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  store: {
    id: number;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
    area: string;
    machineCount: number;
    openingTime: string | null;
    closingTime: string | null;
    isPremium: number;
    officialUrl: string | null;
    sourceUrl: string | null;
  } | null;
  actor: {
    id: number;
    name: string;
    imageUrl: string | null;
    rankScore: number;
  } | null;
}>;
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function EventsList() {
  const { data: events, isLoading } = trpc.events.list.useQuery();

  if (isLoading) return <Text>読み込み中...</Text>;

  return (
    <FlatList
      data={events}
      renderItem={({ item }) => (
        <View>
          <Text>{item.store?.name}</Text>
          <Text>{item.actor?.name}</Text>
          <Text>{item.eventDate.toLocaleDateString()}</Text>
        </View>
      )}
    />
  );
}
```

**cURLでのテスト**:

```bash
curl -s 'http://localhost:3000/api/trpc/events.list' | jq
```

### スクレイピング関連

#### `scraper.run`

スクレイピングを手動実行します。

**メソッド**: `mutation` (POST相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type ScraperRunResponse = {
  success: boolean;
  storesCount: number;
  eventsCount: number;
  actorsCount: number;
  errors?: string[];
  message?: string;
};
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function AdminPanel() {
  const runScraper = trpc.scraper.run.useMutation();
  
  const handleRunScraper = async () => {
    const result = await runScraper.mutateAsync();
    console.log("スクレイピング完了:", result);
  };
  
  return (
    <TouchableOpacity onPress={handleRunScraper}>
      <Text>スクレイピング実行</Text>
    </TouchableOpacity>
  );
}
```

**cURLでのテスト**:

```bash
curl -X POST 'http://localhost:3000/api/trpc/scraper.run' \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### `scraper.status`

スクレイピングの状態を取得します。

**メソッド**: `query` (GET相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type ScraperStatusResponse = {
  lastRun: string;    // ISO 8601形式の日時文字列
  nextRun: string;    // ISO 8601形式の日時文字列
  status: string;     // "idle" など
};
```

### 演者関連

#### `actors.list`

演者一覧を取得します（来店回数とランクスコア付き）。

**メソッド**: `query` (GET相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type ActorsListResponse = Array<{
  id: number;
  name: string;
  rankScore: number;      // ランキングスコア
  eventCount: number;     // 来店回数
}>;
```

レスポンスはrankScoreの降順でソートされます。

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function ActorsList() {
  const { data: actors, isLoading } = trpc.actors.list.useQuery();
  
  if (isLoading) return <Text>読み込み中...</Text>;
  
  return (
    <FlatList
      data={actors}
      renderItem={({ item }) => <Text>{item.name}</Text>}
    />
  );
}
```

#### `actors.getById`

演者の詳細情報を取得します（イベント一覧を含む）。

**メソッド**: `query` (GET相当)

**パラメータ**:

```typescript
number  // actorId
```

**レスポンス**:

```typescript
type ActorDetailResponse = {
  id: number;
  name: string;
  imageUrl: string | null;
  rankScore: number;
  createdAt: Date;
  updatedAt: Date;
  events: Array<{
    id: number;
    storeId: number;
    actorId: number | null;
    eventDate: Date;
    hotLevel: number;
    machineType: string | null;
    description: string | null;
    sourceUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function ActorDetailScreen({ actorId }: { actorId: number }) {
  const { data: actor, isLoading } = trpc.actors.getById.useQuery(actorId);

  if (isLoading) return <Text>読み込み中...</Text>;
  if (!actor) return <Text>演者が見つかりません</Text>;

  return (
    <View>
      <Text>{actor.name}</Text>
      <Text>ランクスコア: {actor.rankScore}</Text>
      <Text>イベント数: {actor.events.length}</Text>
    </View>
  );
}
```

#### `actors.rankings`

演者ランキングを取得します。

**メソッド**: `query` (GET相当)

**パラメータ**:

```typescript
{
  limit?: number;  // 取得件数（デフォルト: 10）
}
```

**レスポンス**:

```typescript
type ActorRankingsResponse = Array<{
  id: number;
  name: string;
  rankScore: number;
  eventCount: number;
  // その他のランキング情報
}>;
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function ActorRankings() {
  const { data: rankings, isLoading } = trpc.actors.rankings.useQuery({
    limit: 20
  });

  if (isLoading) return <Text>読み込み中...</Text>;

  return (
    <FlatList
      data={rankings}
      renderItem={({ item, index }) => (
        <View>
          <Text>#{index + 1} {item.name}</Text>
          <Text>スコア: {item.rankScore}</Text>
        </View>
      )}
    />
  );
}
```

#### `actors.calculateRankings`

演者のランキングスコアを再計算します。

**メソッド**: `mutation` (POST相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type CalculateRankingsResponse = {
  success: boolean;
  updatedCount: number;
};
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function AdminPanel() {
  const calculateRankings = trpc.actors.calculateRankings.useMutation();

  const handleCalculate = async () => {
    const result = await calculateRankings.mutateAsync();
    console.log("ランキング再計算完了:", result);
  };

  return (
    <TouchableOpacity onPress={handleCalculate}>
      <Text>ランキング再計算</Text>
    </TouchableOpacity>
  );
}
```

### 認証関連

#### `auth.me`

現在のログインユーザー情報を取得します。

**メソッド**: `query` (GET相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type AuthMeResponse = {
  id: number;
  supabaseUuid: string;
  openId: string | null;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
} | null;
```

認証されていない場合は`null`が返されます。

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";

function UserProfile() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) return <Text>読み込み中...</Text>;
  if (!user) return <Text>ログインしていません</Text>;

  return (
    <View>
      <Text>名前: {user.name}</Text>
      <Text>メール: {user.email}</Text>
      <Text>ロール: {user.role}</Text>
    </View>
  );
}
```

#### `auth.logout`

ログアウトします（実際のログアウト処理はクライアント側のSupabaseで実行されます）。

**メソッド**: `mutation` (POST相当)

**パラメータ**: なし

**レスポンス**:

```typescript
type AuthLogoutResponse = {
  success: true;
};
```

**使用例（フロントエンド）**:

```typescript
import { trpc } from "@/lib/trpc";
import { supabase } from "@/lib/_core/supabase";

function LogoutButton() {
  const logout = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logout.mutateAsync();
    await supabase.auth.signOut();  // クライアント側でSupabaseのセッションをクリア
  };

  return (
    <TouchableOpacity onPress={handleLogout}>
      <Text>ログアウト</Text>
    </TouchableOpacity>
  );
}
```

## エラーハンドリング

tRPCは、エラーを自動的に型安全な形式で返します。

### エラーコード

- `BAD_REQUEST`: 不正なリクエスト（400）
- `UNAUTHORIZED`: 認証エラー（401）
- `FORBIDDEN`: 権限エラー（403）
- `NOT_FOUND`: リソースが見つからない（404）
- `INTERNAL_SERVER_ERROR`: サーバーエラー（500）

### エラーレスポンス

```typescript
{
  error: {
    json: {
      message: "エラーメッセージ",
      code: -32004,
      data: {
        code: "NOT_FOUND",
        httpStatus: 404,
        path: "stores.detail",
        stack: "..."
      }
    }
  }
}
```

### フロントエンドでのエラーハンドリング

```typescript
import { trpc } from "@/lib/trpc";

function MyComponent() {
  const { data, error, isLoading } = trpc.stores.detail.useQuery({ storeId: 1 });
  
  if (error) {
    return <Text>エラー: {error.message}</Text>;
  }
  
  if (isLoading) {
    return <Text>読み込み中...</Text>;
  }
  
  return <Text>{data?.name}</Text>;
}
```

## 新しいエンドポイントの追加

### 手順

1. **ルーターにプロシージャを追加**

```typescript
// server/routers.ts
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";

export const appRouter = router({
  // 既存のルーター...
  
  myNewEndpoint: router({
    list: publicProcedure.query(async () => {
      // データベースクエリ
      const { getDb } = await import("./db");
      const db = await getDb();
      
      const results = await db.select().from(myTable);
      return results;
    }),
    
    create: publicProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db");
        const db = await getDb();
        
        const result = await db.insert(myTable).values(input);
        return { success: true, id: result.insertId };
      }),
  }),
});
```

2. **フロントエンドから呼び出し**

```typescript
import { trpc } from "@/lib/trpc";

function MyComponent() {
  // クエリ（GET）
  const { data } = trpc.myNewEndpoint.list.useQuery();
  
  // ミューテーション（POST）
  const createItem = trpc.myNewEndpoint.create.useMutation();
  
  const handleCreate = async () => {
    await createItem.mutateAsync({
      name: "新しいアイテム",
      description: "説明",
    });
  };
  
  return (
    <TouchableOpacity onPress={handleCreate}>
      <Text>作成</Text>
    </TouchableOpacity>
  );
}
```

3. **テストを作成**

```typescript
// tests/my-new-endpoint.test.ts
import { describe, it, expect } from "vitest";

describe("My New Endpoint", () => {
  it("should list items", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/myNewEndpoint.list");
    const data = await response.json();
    
    expect(data).toHaveProperty("result");
    expect(Array.isArray(data.result.data.json)).toBe(true);
  });
});
```

## パフォーマンス最適化

### バッチリクエスト

tRPCは自動的に複数のリクエストをバッチ処理します:

```typescript
// 以下の2つのクエリは1つのHTTPリクエストにまとめられる
const stores = trpc.stores.list.useQuery();
const actors = trpc.actors.list.useQuery();
```

### キャッシュ

React Queryのキャッシュ機能を活用:

```typescript
const { data } = trpc.stores.list.useQuery(undefined, {
  staleTime: 60000,  // 1分間はキャッシュを使用
  cacheTime: 300000, // 5分間はメモリに保持
});
```

### 無限スクロール

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
} = trpc.stores.listPaginated.useInfiniteQuery(
  { limit: 20 },
  {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  }
);
```

## 参考リソース

- [バックエンド技術スタック](./BACKEND.md)
- [tRPC Documentation](https://trpc.io/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)

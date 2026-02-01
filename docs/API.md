# API仕様書

このドキュメントは、アツマチプロジェクトのtRPC APIの詳細な仕様です。

## 概要

アツマチのバックエンドAPIは、tRPCを使用して型安全なAPI通信を実現しています。フロントエンドからは、tRPCクライアントを通じて自動補完とエラーチェックが可能です。

## ベースURL

- **開発環境**: `http://localhost:3000/api/trpc`
- **本番環境**: `https://3000-xxx.manus.computer/api/trpc`

## 認証

現在は認証なしで全エンドポイントにアクセス可能です。将来的にはJWT認証を実装予定。

## エンドポイント一覧

### 店舗関連

#### `stores.list`

当日のイベントがある店舗一覧を取得します。

**メソッド**: `GET`

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
  machineCount: number | null;
  openingTime: string | null;
  closingTime: string | null;
  isPremium: number;
  officialUrl: string | null;
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
      ranking: number | null;
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
curl -s 'https://3000-xxx.manus.computer/api/trpc/stores.list' | jq
```

#### `stores.detail`

店舗の詳細情報を取得します。

**メソッド**: `GET`

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
      ranking: number | null;
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
curl -s 'https://3000-xxx.manus.computer/api/trpc/stores.detail?batch=1&input=%7B%220%22%3A%7B%22storeId%22%3A1%7D%7D' | jq
```

### スクレイピング関連

#### `scraper.run`

スクレイピングを手動実行します。

**メソッド**: `POST`

**パラメータ**: なし

**レスポンス**:

```typescript
type ScraperRunResponse = {
  success: boolean;
  storesAdded: number;
  eventsAdded: number;
  actorsAdded: number;
  errors: string[];
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
curl -X POST 'https://3000-xxx.manus.computer/api/trpc/scraper.run' \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### `scraper.status`

スクレイピングの状態を取得します。

**メソッド**: `GET`

**パラメータ**: なし

**レスポンス**:

```typescript
type ScraperStatusResponse = {
  isRunning: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
};
```

### 演者関連

#### `actors.list`

演者一覧を取得します。

**メソッド**: `GET`

**パラメータ**: なし

**レスポンス**:

```typescript
type ActorsListResponse = Array<{
  id: number;
  name: string;
  ranking: number | null;
}>;
```

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

#### `actors.detail`

演者の詳細情報を取得します。

**メソッド**: `GET`

**パラメータ**:

```typescript
{
  actorId: number;
}
```

**レスポンス**:

```typescript
type ActorDetailResponse = {
  id: number;
  name: string;
  ranking: number | null;
  events: Array<{
    id: number;
    storeId: number;
    eventDate: Date;
    hotLevel: number;
    machineType: string | null;
    description: string | null;
    store: {
      id: number;
      name: string;
      area: string;
    };
  }>;
} | null;
```

### 認証関連

#### `auth.me`

現在のユーザー情報を取得します。

**メソッド**: `GET`

**パラメータ**: なし

**レスポンス**:

```typescript
type AuthMeResponse = {
  id: number;
  name: string;
  email: string;
} | null;
```

#### `auth.logout`

ログアウトします。

**メソッド**: `POST`

**パラメータ**: なし

**レスポンス**:

```typescript
type AuthLogoutResponse = {
  success: true;
};
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

- [tRPC Documentation](https://trpc.io/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zod Documentation](https://zod.dev/)

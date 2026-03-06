# tRPCによる型安全なAPI提供

このドキュメントでは、プロジェクトで使用しているtRPCによる型安全なAPI設計と実装について解説します。

## 目次

- [従来のREST APIとの違い](#従来のrest-apiとの違い)
- [型安全性の実現方法](#型安全性の実現方法)
- [具体的な使用例](#具体的な使用例)
- [主な機能と仕組み](#主な機能と仕組み)
- [実際の通信フロー](#実際の通信フロー)
- [tRPCのメリット](#trpcのメリット)

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

## 参考資料

- [tRPC公式ドキュメント](https://trpc.io/)
- [Zod公式ドキュメント](https://zod.dev/)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [SuperJSON](https://github.com/blitz-js/superjson)

## 関連ドキュメント

- [開発者ガイド](./DEVELOPMENT.md)
- [API仕様書](./API.md)
- [スクレイピング仕様](./SCRAPING.md)

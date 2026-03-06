# フロントエンド技術スタック

このドキュメントでは、アツマチプロジェクトのフロントエンド実装について詳しく解説します。

## 目次

- [技術スタック概要](#技術スタック概要)
- [アーキテクチャ](#アーキテクチャ)
- [ルーティング](#ルーティング)
- [スタイリング](#スタイリング)
- [状態管理](#状態管理)
- [認証](#認証)
- [データ取得](#データ取得)
- [カスタムフック](#カスタムフック)
- [主要コンポーネント](#主要コンポーネント)

## 技術スタック概要

### コア技術

| 技術 | バージョン | 用途 |
|-----|----------|------|
| React | 19.1.0 | UIライブラリ |
| React Native | 0.81.5 | クロスプラットフォームフレームワーク |
| Expo SDK | 54 | React Nativeの開発プラットフォーム |
| TypeScript | 5.9.3 | 型安全な開発 |

### 主要ライブラリ

- **Expo Router 6**: ファイルベースルーティング
- **NativeWind 4**: Tailwind CSSベースのスタイリング
- **TanStack React Query 5**: サーバー状態管理
- **tRPC Client 11**: 型安全なAPI通信
- **Supabase Auth**: ユーザー認証
- **Expo Location**: 位置情報取得

## アーキテクチャ

### ディレクトリ構造

```
pachislot-event-app/
├── app/                          # Expo Router アプリケーション
│   ├── (tabs)/                   # タブナビゲーション
│   │   ├── _layout.tsx           # タブレイアウト定義
│   │   ├── index.tsx             # 地図画面（ホーム）
│   │   ├── events.tsx            # イベント一覧画面
│   │   ├── favorites.tsx         # お気に入り画面
│   │   └── settings.tsx          # 設定画面
│   ├── store/                    # 店舗詳細
│   │   └── [id].tsx              # 動的ルート
│   ├── oauth/                    # 認証関連
│   └── _layout.tsx               # ルートレイアウト
├── components/                   # 再利用可能なコンポーネント
│   ├── filter-panel.tsx          # フィルターパネル
│   ├── region-selector.tsx       # 地域選択
│   ├── search-bar.tsx            # 検索バー
│   ├── web-map.tsx               # 地図コンポーネント
│   └── ui/                       # UIコンポーネント
├── hooks/                        # カスタムフック
│   ├── use-auth.ts               # 認証フック
│   ├── use-favorites.ts          # お気に入りフック
│   ├── use-location.ts           # 位置情報フック
│   └── use-colors.ts             # テーマカラーフック
├── lib/                          # ライブラリ・ユーティリティ
│   ├── trpc.ts                   # tRPCクライアント設定
│   ├── theme-provider.tsx        # テーマプロバイダー
│   └── _core/
│       └── supabase.ts           # Supabase設定
└── constants/                    # 定数・設定
    ├── theme.ts                  # テーマ定義
    └── const.ts                  # アプリ定数
```

## ルーティング

### Expo Router (ファイルベースルーティング)

Expo Router 6を使用したファイルベースルーティングシステム。

#### ルート構成

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="store/[id]" options={{ presentation: "modal" }} />
              </Stack>
            </QueryClientProvider>
          </trpc.Provider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
```

#### タブナビゲーション

```typescript
// app/(tabs)/_layout.tsx
<Tabs
  screenOptions={{
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    headerShown: false,
    tabBarButton: HapticTab,  // 触覚フィードバック付き
  }}
>
  <Tabs.Screen name="index" options={{ title: "地図" }} />
  <Tabs.Screen name="events" options={{ title: "イベント" }} />
  <Tabs.Screen name="favorites" options={{ title: "お気に入り" }} />
  <Tabs.Screen name="settings" options={{ title: "設定" }} />
</Tabs>
```

#### 動的ルート

```typescript
// app/store/[id].tsx
import { useLocalSearchParams } from "expo-router";

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const storeId = parseInt(id, 10);

  const { data: store } = trpc.stores.detail.useQuery({ storeId });
  // ...
}
```

### ナビゲーション

```typescript
import { useRouter } from "expo-router";

function MyComponent() {
  const router = useRouter();

  // プッシュ
  router.push(`/store/${storeId}`);

  // 戻る
  router.back();

  // 置き換え
  router.replace("/events");
}
```

## スタイリング

### NativeWind (Tailwind CSS for React Native)

Tailwind CSSのユーティリティクラスをReact Nativeで使用可能にするライブラリ。

#### 設定

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,tsx}",
    "./components/**/*.{js,ts,tsx}",
    "./lib/**/*.{js,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        background: "var(--color-background)",
        // ...
      },
    },
  },
};
```

#### 使用例

```tsx
import { View, Text, Pressable } from "react-native";

function MyComponent() {
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-2xl font-bold text-foreground mb-4">
        タイトル
      </Text>
      <Pressable className="bg-primary px-4 py-3 rounded-lg active:opacity-80">
        <Text className="text-white text-center font-semibold">
          ボタン
        </Text>
      </Pressable>
    </View>
  );
}
```

### テーマシステム

#### テーマプロバイダー

```typescript
// lib/theme-provider.tsx
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("light");

  const applyScheme = useCallback((scheme: ColorScheme) => {
    nativewindColorScheme.set(scheme);
    Appearance.setColorScheme?.(scheme);

    // CSS変数を更新
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.dataset.theme = scheme;
      root.classList.toggle("dark", scheme === "dark");

      const palette = SchemeColors[scheme];
      Object.entries(palette).forEach(([token, value]) => {
        root.style.setProperty(`--color-${token}`, value);
      });
    }
  }, []);

  // ...
}
```

#### カラーパレット使用

```typescript
import { useColors } from "@/hooks/use-colors";

function MyComponent() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>テキスト</Text>
    </View>
  );
}
```

## 状態管理

### TanStack React Query

サーバー状態の管理にReact Queryを使用。

#### 設定

```typescript
// app/_layout.tsx
const [queryClient] = useState(
  () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,  // ウィンドウフォーカス時の再取得を無効化
          retry: 1,                      // リトライ回数
        },
      },
    })
);
```

#### キャッシュ戦略

React Queryは自動的にデータをキャッシュし、以下のタイミングで再取得します:

- コンポーネントのマウント時（キャッシュが古い場合）
- ウィンドウがフォーカスされた時（設定で無効化可能）
- ネットワーク再接続時
- 設定された間隔ごと（polling）

### ローカル状態管理

#### お気に入り機能

```typescript
// hooks/use-favorites.ts
export function useFavorites() {
  const [favoriteStores, setFavoriteStores] = useState<string[]>([]);

  // 初期データ読み込み
  useEffect(() => {
    loadFavoriteStores().then(setFavoriteStores);
  }, []);

  // お気に入り切り替え
  const toggleFavoriteStore = useCallback(async (storeId: string) => {
    setFavoriteStores((prev) => {
      const newFavorites = prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId];

      saveFavoriteStores(newFavorites);
      return newFavorites;
    });
  }, []);

  return {
    favoriteStores,
    toggleFavoriteStore,
    isFavoriteStore: (id: string) => favoriteStores.includes(id),
  };
}
```

## 認証

### Supabase Auth

#### 設定

```typescript
// lib/_core/supabase.ts
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return window.localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,                    // プラットフォーム別のストレージ
    autoRefreshToken: true,     // 自動トークン更新
    persistSession: true,       // セッション永続化
    detectSessionInUrl: false,  // URL内のセッション検出を無効化
  },
});
```

#### 認証フック

```typescript
// hooks/use-auth.ts
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user));
      }
      setLoading(false);
    });

    // 認証状態変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ? mapUser(session.user) : null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
```

#### 使用例

```typescript
function SettingsScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <Text>ログインしていません</Text>;
  }

  return (
    <View>
      <Text>ようこそ、{user.name}さん</Text>
      <Pressable onPress={logout}>
        <Text>ログアウト</Text>
      </Pressable>
    </View>
  );
}
```

## データ取得

### tRPCクライアント

#### 設定

```typescript
// lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          // 認証トークンを自動付与
          const { data: { session } } = await supabase.auth.getSession();
          return session ? { Authorization: `Bearer ${session.access_token}` } : {};
        },
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
```

#### クエリ（データ取得）

```typescript
function StoresList() {
  const { data: stores, isLoading, error } = trpc.stores.list.useQuery();

  if (isLoading) return <Text>読み込み中...</Text>;
  if (error) return <Text>エラー: {error.message}</Text>;

  return (
    <FlatList
      data={stores}
      renderItem={({ item }) => <StoreCard store={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
}
```

#### ミューテーション（データ更新）

```typescript
function AdminPanel() {
  const runScraper = trpc.scraper.run.useMutation({
    onSuccess: (data) => {
      console.log("スクレイピング完了:", data);
    },
    onError: (error) => {
      console.error("エラー:", error);
    },
  });

  return (
    <Pressable
      onPress={() => runScraper.mutate()}
      disabled={runScraper.isLoading}
    >
      <Text>
        {runScraper.isLoading ? "実行中..." : "スクレイピング実行"}
      </Text>
    </Pressable>
  );
}
```

#### パラメータ付きクエリ

```typescript
function RegionalStores() {
  const { data: stores } = trpc.stores.listByRegion.useQuery({
    prefectures: ['東京都', '神奈川県', '埼玉県', '千葉県']
  });

  return (
    <FlatList
      data={stores}
      renderItem={({ item }) => <StoreCard store={item} />}
    />
  );
}
```

## カスタムフック

### use-location (位置情報)

```typescript
// hooks/use-location.ts
export function useLocation() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 位置情報の権限をリクエスト
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('位置情報の権限が拒否されました');
        return;
      }

      // 現在地を取得
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(location);
    } catch (err) {
      setError(err instanceof Error ? err.message : '位置情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, getCurrentLocation };
}
```

### use-favorites (お気に入り)

お気に入り機能を提供するフック。演者、エリア、機種、店舗のお気に入りを管理します。

```typescript
function FavoriteButton({ storeId }: { storeId: string }) {
  const { isFavoriteStore, toggleFavoriteStore } = useFavorites();
  const isFavorite = isFavoriteStore(storeId);

  return (
    <Pressable onPress={() => toggleFavoriteStore(storeId)}>
      <IconSymbol
        name={isFavorite ? "star.fill" : "star"}
        size={24}
        color={isFavorite ? "#FFD700" : "#999"}
      />
    </Pressable>
  );
}
```

### use-colors (テーマカラー)

現在のテーマに応じたカラーパレットを取得します。

```typescript
function MyComponent() {
  const colors = useColors();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.foreground }}>テキスト</Text>
      <Pressable style={{ backgroundColor: colors.primary }}>
        <Text style={{ color: colors.background }}>ボタン</Text>
      </Pressable>
    </View>
  );
}
```

## 主要コンポーネント

### SearchBar (検索バー)

```typescript
// components/search-bar.tsx
export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const colors = useColors();

  return (
    <View className="flex-row items-center bg-surface px-4 py-2 rounded-lg border border-border">
      <IconSymbol name="magnifyingglass" size={20} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        className="flex-1 ml-2 text-foreground"
      />
    </View>
  );
}
```

### FilterPanel (フィルターパネル)

```typescript
// components/filter-panel.tsx
export function FilterPanel({ onApply, onReset }: FilterPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    hotLevels: [],
    areas: [],
  });

  return (
    <View className="bg-surface p-4 rounded-lg border border-border">
      <Text className="text-lg font-bold text-foreground mb-4">
        フィルター
      </Text>

      {/* アツさレベル選択 */}
      <View className="mb-4">
        <Text className="text-sm font-semibold text-foreground mb-2">
          アツさレベル
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <Pressable
              key={level}
              className={`px-3 py-1 rounded-full ${
                filters.hotLevels.includes(level)
                  ? "bg-primary"
                  : "bg-surface border border-border"
              }`}
              onPress={() => toggleHotLevel(level)}
            >
              <Text>⭐ {level}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ボタン */}
      <View className="flex-row gap-2">
        <Pressable className="flex-1 bg-primary p-3 rounded-lg" onPress={onApply}>
          <Text className="text-center text-white font-semibold">適用</Text>
        </Pressable>
        <Pressable className="flex-1 bg-surface border border-border p-3 rounded-lg" onPress={onReset}>
          <Text className="text-center font-semibold">リセット</Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### RegionSelector (地域選択)

```typescript
// components/region-selector.tsx
export function RegionSelector({ selectedRegion, onSelect }: RegionSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      {REGIONS.map((region) => (
        <Pressable
          key={region.id}
          className={`mr-2 px-4 py-2 rounded-full ${
            selectedRegion === region.id
              ? "bg-primary"
              : "bg-surface border border-border"
          }`}
          onPress={() => onSelect(region.id)}
        >
          <Text
            className={`font-semibold ${
              selectedRegion === region.id ? "text-white" : "text-foreground"
            }`}
          >
            {region.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
```

## パフォーマンス最適化

### React.memo

再レンダリングを最適化:

```typescript
const StoreCard = React.memo(({ store }: { store: Store }) => {
  return (
    <View className="bg-surface p-4 rounded-lg mb-2">
      <Text className="text-lg font-bold">{store.name}</Text>
      <Text className="text-sm text-muted">{store.address}</Text>
    </View>
  );
});
```

### useCallback / useMemo

不要な再計算を防ぐ:

```typescript
const filteredStores = useMemo(() => {
  return stores?.filter(store =>
    store.name.includes(searchQuery)
  ) ?? [];
}, [stores, searchQuery]);

const handlePress = useCallback((storeId: number) => {
  router.push(`/store/${storeId}`);
}, [router]);
```

### FlatList最適化

```typescript
<FlatList
  data={stores}
  renderItem={renderStoreItem}
  keyExtractor={(item) => item.id.toString()}
  initialNumToRender={10}           // 初期レンダリング数
  maxToRenderPerBatch={10}          // バッチごとのレンダリング数
  windowSize={5}                     // 表示領域の倍率
  removeClippedSubviews={true}      // 画面外の要素を削除
  getItemLayout={(data, index) => ({ // アイテムサイズ固定の場合
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## 開発のベストプラクティス

### 1. 型安全性の維持

```typescript
// 型をインポートして使用
import type { Store, Event } from "@/types";

// propsに型を定義
interface StoreCardProps {
  store: Store;
  onPress: (storeId: number) => void;
}
```

### 2. エラーハンドリング

```typescript
function MyComponent() {
  const { data, error, isLoading } = trpc.stores.list.useQuery();

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return <StoresList stores={data} />;
}
```

### 3. アクセシビリティ

```typescript
<Pressable
  accessibilityRole="button"
  accessibilityLabel="店舗の詳細を表示"
  accessibilityHint="タップすると店舗の詳細画面に移動します"
>
  <Text>詳細を見る</Text>
</Pressable>
```

### 4. プラットフォーム別処理

```typescript
import { Platform } from "react-native";

const styles = {
  container: {
    padding: Platform.select({
      ios: 16,
      android: 12,
      web: 20,
    }),
  },
};
```

## まとめ

このフロントエンドアーキテクチャは以下の利点を提供します:

✅ **型安全性**: TypeScript + tRPCによるエンドツーエンドの型安全性
✅ **クロスプラットフォーム**: iOS/Android/Webで単一のコードベース
✅ **開発体験**: Expo + Hot Reloadによる高速な開発サイクル
✅ **スタイリング**: Tailwind CSSライクな直感的なスタイリング
✅ **状態管理**: React Queryによる効率的なサーバー状態管理
✅ **認証**: Supabase Authによる安全な認証フロー
✅ **パフォーマンス**: 最適化されたレンダリングとキャッシング

## 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [tRPC Documentation](https://trpc.io/)
- [Supabase Documentation](https://supabase.com/docs)

## 関連ドキュメント

- [バックエンド技術スタック](./BACKEND.md)
- [API仕様書](./API.md)
- [開発者ガイド](./DEVELOPMENT.md)

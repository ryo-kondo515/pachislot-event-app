import { useRef, useState, useCallback, useEffect } from 'react';
import { Text, View, Pressable, StyleSheet, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Asset } from 'expo-asset';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';
import { trpc } from '@/lib/trpc';
import { Store, HotLevel } from '@/types';
import { useLocation } from '@/hooks/use-location';
import { calculateDistance, formatDistance } from '@/lib/location-utils';
import { SearchBar } from '@/components/search-bar';
import { FilterPanel, FilterOptions } from '@/components/filter-panel';
import { RegionSelector } from '@/components/region-selector';
import { REGIONS } from '@/constants/const';

export default function MapScreen() {
  const colors = useColors();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapHtml, setMapHtml] = useState<string>('');
  const [sortedStores, setSortedStores] = useState<Store[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const { location, loading: locationLoading, getCurrentLocation } = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    hotLevels: [],
    areas: [],
  });
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>('kanto'); // デフォルトは関東
  const [loadedRegions, setLoadedRegions] = useState<Set<string>>(new Set()); // ロード完了した地域
  const [isRegionLoading, setIsRegionLoading] = useState(false); // 地域切り替え時のローディング
  const [legendCollapsed, setLegendCollapsed] = useState(false); // 凡例の折りたたみ状態
  const [isMapReady, setIsMapReady] = useState(false); // 地図の初期化完了フラグ
  const [shouldLoadOtherRegions, setShouldLoadOtherRegions] = useState(false); // 他地域の読み込み開始フラグ

  // 優先地域（関東）のデータを取得
  const kantoRegion = REGIONS.find(r => r.id === 'kanto');
  const { data: kantoStoresData, isLoading: kantoLoading } = trpc.stores.listByRegion.useQuery(
    { prefectures: kantoRegion?.prefectures || [] },
    { enabled: !!kantoRegion }
  );

  // HTMLファイルを読み込む（Web版ではスキップ）
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web版では地図を使用しないのでスキップ
      return;
    }
    async function loadMapHtml() {
      try {
        const asset = Asset.fromModule(require('@/assets/html/map.html'));
        await asset.downloadAsync();
        const response = await fetch(asset.localUri || asset.uri);
        const html = await response.text();
        setMapHtml(html);
      } catch (error) {
        console.error('Failed to load map HTML:', error);
      }
    }
    loadMapHtml();
  }, []);

  // 関東のデータを最初にロード
  useEffect(() => {
    if (kantoStoresData) {
      console.log('[Kanto] Received stores:', kantoStoresData.length);
      const stores: Store[] = kantoStoresData.map((store: any) => ({
        id: store.id.toString(),
        name: store.name,
        address: store.address,
        latitude: parseFloat(store.latitude),
        longitude: parseFloat(store.longitude),
        hotLevel: store.events[0]?.hotLevel || 3,
        machineCount: store.machineCount,
        openingHours: `${store.openingTime || '10:00'} - ${store.closingTime || '23:00'}`,
        isPremium: store.isPremium === 1,
      }));

      console.log('[Kanto] Converted stores:', stores.length);
      // 関東のデータを先に設定
      setAllStores(stores);
      setSortedStores(stores);
      setLoadedRegions(prev => new Set([...prev, 'kanto']));

      // 関東データの読み込みが完了したら、他の地域の読み込みを開始
      if (!shouldLoadOtherRegions) {
        console.log('[Background] Starting to load other regions...');
        setShouldLoadOtherRegions(true);
      }
    }
  }, [kantoStoresData, shouldLoadOtherRegions]);

  // バックグラウンドで全地域のデータを取得（関東以外）
  const otherRegionIds = ['hokkaido', 'tohoku', 'chubu', 'kinki', 'chugoku', 'shikoku', 'kyushu'];

  const hokkaidoRegion = REGIONS.find(r => r.id === 'hokkaido');
  const { data: hokkaidoStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: hokkaidoRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!hokkaidoRegion, staleTime: 10 * 60 * 1000 }
  );

  const tohokuRegion = REGIONS.find(r => r.id === 'tohoku');
  const { data: tohokuStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: tohokuRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!tohokuRegion, staleTime: 10 * 60 * 1000 }
  );

  const chubuRegion = REGIONS.find(r => r.id === 'chubu');
  const { data: chubuStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: chubuRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!chubuRegion, staleTime: 10 * 60 * 1000 }
  );

  const kinkiRegion = REGIONS.find(r => r.id === 'kinki');
  const { data: kinkiStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: kinkiRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!kinkiRegion, staleTime: 10 * 60 * 1000 }
  );

  const chugokuRegion = REGIONS.find(r => r.id === 'chugoku');
  const { data: chugokuStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: chugokuRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!chugokuRegion, staleTime: 10 * 60 * 1000 }
  );

  const shikokuRegion = REGIONS.find(r => r.id === 'shikoku');
  const { data: shikokuStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: shikokuRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!shikokuRegion, staleTime: 10 * 60 * 1000 }
  );

  const kyushuRegion = REGIONS.find(r => r.id === 'kyushu');
  const { data: kyushuStores } = trpc.stores.listByRegion.useQuery(
    { prefectures: kyushuRegion?.prefectures || [] },
    { enabled: shouldLoadOtherRegions && !!kyushuRegion, staleTime: 10 * 60 * 1000 }
  );

  // 各地域のデータを統合（バックグラウンド読み込み用）
  useEffect(() => {
    const regionDataMap = [
      { id: 'hokkaido', data: hokkaidoStores, region: hokkaidoRegion },
      { id: 'tohoku', data: tohokuStores, region: tohokuRegion },
      { id: 'chubu', data: chubuStores, region: chubuRegion },
      { id: 'kinki', data: kinkiStores, region: kinkiRegion },
      { id: 'chugoku', data: chugokuStores, region: chugokuRegion },
      { id: 'shikoku', data: shikokuStores, region: shikokuRegion },
      { id: 'kyushu', data: kyushuStores, region: kyushuRegion },
    ];

    regionDataMap.forEach(({ id, data, region }) => {
      if (data && region && !loadedRegions.has(id)) {
        console.log(`[Background] ${id} data received:`, data.length);
        const stores: Store[] = data.map((store: any) => ({
          id: store.id.toString(),
          name: store.name,
          address: store.address,
          latitude: parseFloat(store.latitude),
          longitude: parseFloat(store.longitude),
          hotLevel: store.events[0]?.hotLevel || 3,
          machineCount: store.machineCount,
          openingHours: `${store.openingTime || '10:00'} - ${store.closingTime || '23:00'}`,
          isPremium: store.isPremium === 1,
        }));

        // 既存データから同じ地域のデータを除外してから追加
        setAllStores(prev => {
          const filtered = prev.filter(store =>
            !region.prefectures.some(pref => store.address.includes(pref))
          );
          return [...filtered, ...stores];
        });

        setLoadedRegions(prev => new Set([...prev, id]));
      }
    });
  }, [hokkaidoStores, tohokuStores, chubuStores, kinkiStores, chugokuStores, shikokuStores, kyushuStores, loadedRegions, hokkaidoRegion, tohokuRegion, chubuRegion, kinkiRegion, chugokuRegion, shikokuRegion, kyushuRegion]);

  // 地域選択時に即座に地図の中心を移動（データの有無にかかわらず）
  useEffect(() => {
    if (webViewRef.current && selectedRegion && isMapReady) {
      const region = REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        console.log('[Map] Moving map center to:', region.name);
        webViewRef.current.postMessage(JSON.stringify({
          type: 'centerMap',
          latitude: region.center.latitude,
          longitude: region.center.longitude,
          zoom: region.zoom
        }));
        webViewRef.current.postMessage(JSON.stringify({
          type: 'setRegionBounds',
          bounds: region.bounds
        }));
      }
    }
  }, [selectedRegion, isMapReady]);

  // allStoresが更新されたらsortedStoresも更新
  useEffect(() => {
    setSortedStores([...allStores]);
  }, [allStores]);

  // 地域切り替え時のローディング状態管理
  useEffect(() => {
    if (selectedRegion === 'kanto') {
      setIsRegionLoading(kantoLoading);
    } else if (selectedRegion) {
      // バックグラウンドで読み込み済みかチェック
      const isLoaded = loadedRegions.has(selectedRegion);
      setIsRegionLoading(!isLoaded);

      // まだ読み込まれていない場合は、読み込み完了を待つ
      if (isLoaded) {
        console.log(`[Region] ${selectedRegion} already loaded from background`);
      }
    }
  }, [selectedRegion, kantoLoading, loadedRegions]);

  // バックグラウンド読み込み完了の監視
  useEffect(() => {
    if (selectedRegion && selectedRegion !== 'kanto' && loadedRegions.has(selectedRegion)) {
      setIsRegionLoading(false);
    }

    // 全地域の読み込みが完了したことをログに出力
    const allRegions = ['kanto', 'hokkaido', 'tohoku', 'chubu', 'kinki', 'chugoku', 'shikoku', 'kyushu'];
    const allLoaded = allRegions.every(regionId => loadedRegions.has(regionId));
    if (allLoaded && loadedRegions.size === allRegions.length) {
      console.log('[Background] All regions loaded successfully!');
      console.log('[Background] Total stores:', allStores.length);
    }
  }, [loadedRegions, selectedRegion, allStores.length]);

  // 検索・フィルター処理
  useEffect(() => {
    let result = allStores;
    console.log('[Filter] All stores:', result.length);

    // 地方でフィルタリング（常に選択されている）
    const region = REGIONS.find(r => r.id === selectedRegion);
    if (region) {
      result = result.filter(store =>
        region.prefectures.some(pref => store.address.includes(pref))
      );
      console.log('[Filter] After region filter:', result.length, 'Region:', region.name);
    }

    // 検索クエリでフィルタリング
    if (searchQuery) {
      result = result.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // アツさレベルでフィルタリング
    if (filters.hotLevels.length > 0) {
      result = result.filter(store => filters.hotLevels.includes(store.hotLevel));
    }

    // エリアでフィルタリング
    if (filters.areas.length > 0) {
      result = result.filter(store =>
        filters.areas.some(area => store.address.includes(area))
      );
    }

    console.log('[Filter] Final filtered stores:', result.length);
    setFilteredStores(result);

    // 地図にフィルタリング済みデータを送信
    if (webViewRef.current) {
      console.log('[Map] Sending stores to map:', result.length);
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setStores',
        stores: result
      }));

      // データが存在する場合は地図の中心も調整（確実に表示するため）
      if (result.length > 0 && region) {
        console.log('[Map] Adjusting map center with data:', region.name);
        webViewRef.current.postMessage(JSON.stringify({
          type: 'centerMap',
          latitude: region.center.latitude,
          longitude: region.center.longitude,
          zoom: region.zoom
        }));
      }
    }
  }, [allStores, searchQuery, filters, selectedRegion]);

  // 地図が読み込まれたら店舗データを送信
  const handleMapReady = useCallback(() => {
    if (webViewRef.current && filteredStores.length > 0) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setStores',
        stores: filteredStores
      }));
    }
  }, [filteredStores]);

  // WebViewからのメッセージを処理
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'mapReady') {
        console.log('[Map] Map is ready');
        setIsMapReady(true);
        handleMapReady();
      } else if (data.type === 'markerClick') {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        const store = allStores.find((s: Store) => s.id === data.store.id);
        if (store) {
          setSelectedStore(store);
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }, [handleMapReady, allStores]);

  const handleStoreDetailPress = useCallback(async () => {
    if (selectedStore) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // officialUrlがある場合は外部ブラウザで開く（将来の拡張用）
      // 現在は詳細ページに遷移
      router.push(`/store/${selectedStore.id}` as any);
    }
  }, [selectedStore, router]);

  const handleCurrentLocation = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // 現在地を取得
    const userLocation = await getCurrentLocation();

    if (userLocation && webViewRef.current) {
      // 地図を現在地に移動
      webViewRef.current.postMessage(JSON.stringify({
        type: 'centerMap',
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        zoom: 13
      }));

      // 距離順にソート
      const storesWithDistance = allStores.map((store: Store) => ({
        ...store,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          store.latitude,
          store.longitude
        )
      }));

      const sorted = storesWithDistance.sort((a: Store & { distance: number }, b: Store & { distance: number }) => a.distance - b.distance);
      setAllStores(sorted);
    }
  }, [getCurrentLocation]);

  const closePreview = useCallback(() => {
    setSelectedStore(null);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'closePreview'
      }));
    }
  }, []);

  // Web環境でも地図を表示
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 地方選択 */}
        <View style={{ padding: 16 }}>
          <RegionSelector
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </View>

        <Text style={[styles.webTitle, { color: colors.foreground, paddingHorizontal: 16 }]}>
          店舗一覧 - {REGIONS.find(r => r.id === selectedRegion)?.name}
          {filteredStores.length > 0 && !isRegionLoading && ` (${filteredStores.length}件)`}
        </Text>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {(kantoLoading || isRegionLoading) && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[{ marginTop: 10, color: colors.muted }]}>
                {isRegionLoading
                  ? `${REGIONS.find(r => r.id === selectedRegion)?.name}の店舗情報を読み込んでいます...`
                  : '店舗情報を読み込んでいます...'}
              </Text>
            </View>
          )}
          {!kantoLoading && !isRegionLoading && filteredStores.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={[{ color: colors.muted }]}>この地方には店舗情報がありません</Text>
            </View>
          )}
          {!kantoLoading && !isRegionLoading && filteredStores.map((store: Store) => (
            <Pressable
              key={store.id}
              onPress={() => router.push(`/store/${store.id}` as any)}
              style={({ pressed }) => [
                styles.storeCard,
                {
                  backgroundColor: colors.surface,
                  borderLeftColor: getHotLevelColor(store.hotLevel),
                },
                pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
              ]}
            >
              <View style={styles.storeHeader}>
                <Text style={[styles.storeCardName, { color: colors.foreground }]} numberOfLines={1}>
                  {store.name}
                </Text>
                <View style={[styles.webHotBadge, { backgroundColor: getHotLevelColor(store.hotLevel) }]}>
                  <Text style={styles.webHotBadgeText}>
                    {getHotLevelLabel(store.hotLevel)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.storeCardAddress, { color: colors.muted }]} numberOfLines={1}>
                {store.address}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!mapHtml || kantoLoading || isRegionLoading) {
    const regionName = selectedRegion ? REGIONS.find(r => r.id === selectedRegion)?.name : '';
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 100 }} />
        <Text style={[styles.loadingText, { color: colors.foreground }]}>
          {!mapHtml ? '地図を読み込んでいます...' :
           isRegionLoading ? `${regionName}の店舗情報を読み込んでいます...` :
           '店舗情報を読み込んでいます...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 検索バーとフィルター */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <View style={styles.searchBarWrapper}>
          <SearchBar
            placeholder="店舗名、住所で検索"
            onSearch={setSearchQuery}
          />
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowFilters(true);
          }}
          style={({ pressed }: { pressed: boolean }) => [
            styles.filterButton,
            { backgroundColor: colors.surface },
            pressed && { opacity: 0.8 },
            (filters.hotLevels.length > 0 || filters.areas.length > 0) && {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <IconSymbol
            name="slider.horizontal.3"
            size={24}
            color={
              filters.hotLevels.length > 0 || filters.areas.length > 0
                ? '#FFFFFF'
                : colors.foreground
            }
          />
        </Pressable>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />

      {/* 現在地ボタン */}
      <Pressable
        onPress={handleCurrentLocation}
        disabled={locationLoading}
        style={({ pressed }) => [
          styles.locationButton,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.8 },
          locationLoading && { opacity: 0.6 },
        ]}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <IconSymbol name="location.fill" size={24} color={colors.primary} />
        )}
      </Pressable>

      {/* 地方選択 */}
      <RegionSelector
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
      />

      {/* 凡例 */}
      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setLegendCollapsed(!legendCollapsed);
          }}
          style={styles.legendHeader}
        >
          <IconSymbol name="flame.fill" size={12} color={colors.primary} />
          <Text style={[styles.legendTitle, { color: colors.foreground }]}>
            アツさ
          </Text>
          <IconSymbol
            name={legendCollapsed ? "chevron.down" : "chevron.up"}
            size={12}
            color={colors.muted}
          />
        </Pressable>

        {!legendCollapsed && (
          <View style={styles.legendItems}>
            {[5, 4, 3, 2, 1].map((level) => (
              <View key={level} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: getHotLevelColor(level as any) },
                  ]}
                />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {getHotLevelLabel(level as any)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 店舗プレビューカード */}
      {selectedStore && (
        <View style={[styles.previewCard, {
          backgroundColor: colors.surface,
          borderColor: `${getHotLevelColor(selectedStore.hotLevel)}40`,
        }]}>
          <Pressable
            onPress={closePreview}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.background },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark" size={16} color={colors.muted} />
          </Pressable>

          <Pressable
            onPress={handleStoreDetailPress}
            style={({ pressed }) => [
              styles.previewContent,
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={styles.previewHeader}>
              <View
                style={[
                  styles.hotBadge,
                  { backgroundColor: getHotLevelColor(selectedStore.hotLevel) },
                ]}
              >
                <IconSymbol name="flame.fill" size={10} color="#FFFFFF" />
                <Text style={styles.hotBadgeText}>
                  {getHotLevelLabel(selectedStore.hotLevel)}
                </Text>
              </View>
              {selectedStore.isPremium && (
                <View style={[styles.premiumTag, { backgroundColor: colors.gold }]}>
                  <IconSymbol name="star.fill" size={10} color="#000000" />
                  <Text style={styles.premiumTagText}>優良店</Text>
                </View>
              )}
            </View>

            <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>
              {selectedStore.name}
            </Text>
            <Text style={[styles.storeAddress, { color: colors.muted }]} numberOfLines={1}>
              {selectedStore.address}
            </Text>

            <View style={styles.storeInfo}>
              <View style={styles.infoItem}>
                <IconSymbol name="clock.fill" size={13} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  {selectedStore.openingHours}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <IconSymbol name="flame.fill" size={13} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  {selectedStore.machineCount}台
                </Text>
              </View>
              {selectedStore.distance !== undefined && (
                <View style={styles.infoItem}>
                  <IconSymbol name="location.fill" size={13} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.primary }]}>
                    {formatDistance(selectedStore.distance)}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.tapHint, { borderTopColor: colors.border }]}>
              <Text style={[styles.tapHintText, { color: colors.primary }]}>
                詳細を見る
              </Text>
              <IconSymbol name="chevron.right" size={14} color={colors.primary} />
            </View>
          </Pressable>
        </View>
      )}

      {/* フィルターパネル */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    zIndex: 100,
  },
  searchBarWrapper: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  storeCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  storeCardName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  storeCardAddress: {
    fontSize: 13,
  },
  webHotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  webHotBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  locationButton: {
    position: 'absolute',
    top: 130,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 90,
  },
  legend: {
    position: 'absolute',
    top: 290,
    left: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 80,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  legendItems: {
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 11,
  },
  previewCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 95,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    gap: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  premiumTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumTagText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  storeAddress: {
    fontSize: 12,
  },
  storeInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  infoText: {
    fontSize: 11,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

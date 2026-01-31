import { useRef, useState, useCallback, useEffect } from 'react';
import { Text, View, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Asset } from 'expo-asset';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { mockStores, getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';
import { Store } from '@/types';

export default function MapScreen() {
  const colors = useColors();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [mapHtml, setMapHtml] = useState<string>('');

  // HTMLファイルを読み込む
  useEffect(() => {
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

  // 地図が読み込まれたら店舗データを送信
  const handleMapReady = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'setStores',
        stores: mockStores
      }));
    }
  }, []);

  // WebViewからのメッセージを処理
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapReady') {
        handleMapReady();
      } else if (data.type === 'markerClick') {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        const store = mockStores.find(s => s.id === data.store.id);
        if (store) {
          setSelectedStore(store);
        }
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }, [handleMapReady]);

  const handleStoreDetailPress = useCallback(() => {
    if (selectedStore) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      router.push(`/store/${selectedStore.id}` as any);
    }
  }, [selectedStore, router]);

  const handleCurrentLocation = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // 東京駅に戻る
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'centerMap',
        latitude: 35.6812,
        longitude: 139.7671,
        zoom: 12
      }));
    }
  }, []);

  const closePreview = useCallback(() => {
    setSelectedStore(null);
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({
        type: 'closePreview'
      }));
    }
  }, []);

  // Web環境ではWebViewが使えないため、店舗リスト表示
  if (Platform.OS === 'web') {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.webContainer}>
          <Text style={[styles.webTitle, { color: colors.foreground }]}>店舗一覧</Text>
          <Text style={[styles.webSubtitle, { color: colors.muted }]}>
            モバイルアプリで地図表示が利用できます
          </Text>
          {mockStores.map((store) => (
            <Pressable
              key={store.id}
              onPress={() => router.push(`/store/${store.id}` as any)}
              style={({ pressed }) => [
                styles.storeCard,
                { backgroundColor: colors.surface },
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={styles.storeHeader}>
                <View
                  style={[
                    styles.hotIndicator,
                    { backgroundColor: getHotLevelColor(store.hotLevel) },
                  ]}
                />
                <Text style={[styles.storeCardName, { color: colors.foreground }]}>
                  {store.name}
                </Text>
              </View>
              <Text style={[styles.storeCardAddress, { color: colors.muted }]}>
                {store.address}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  if (!mapHtml) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.foreground }]}>
          地図を読み込んでいます...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        style={({ pressed }) => [
          styles.locationButton,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.8 },
        ]}
      >
        <IconSymbol name="location.fill" size={24} color={colors.primary} />
      </Pressable>

      {/* 凡例 */}
      <View style={[styles.legend, { backgroundColor: colors.surface }]}>
        <Text style={[styles.legendTitle, { color: colors.foreground }]}>アツさレベル</Text>
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
      </View>

      {/* 店舗プレビューカード */}
      {selectedStore && (
        <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={closePreview}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="xmark" size={20} color={colors.muted} />
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
                <Text style={styles.hotBadgeText}>
                  {getHotLevelLabel(selectedStore.hotLevel)}
                </Text>
              </View>
              {selectedStore.isPremium && (
                <View style={[styles.premiumTag, { backgroundColor: colors.gold }]}>
                  <Text style={styles.premiumTagText}>優良店</Text>
                </View>
              )}
            </View>

            <Text style={[styles.storeName, { color: colors.foreground }]}>
              {selectedStore.name}
            </Text>
            <Text style={[styles.storeAddress, { color: colors.muted }]}>
              {selectedStore.address}
            </Text>

            <View style={styles.storeInfo}>
              <View style={styles.infoItem}>
                <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  {selectedStore.openingHours}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <IconSymbol name="flame.fill" size={14} color={colors.muted} />
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  {selectedStore.machineCount}台
                </Text>
              </View>
            </View>

            <View style={[styles.tapHint, { borderTopColor: colors.border }]}>
              <Text style={[styles.tapHintText, { color: colors.primary }]}>
                タップして詳細を見る
              </Text>
              <IconSymbol name="chevron.right" size={16} color={colors.primary} />
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  webContainer: {
    padding: 16,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  webSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  storeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  hotIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  storeCardName: {
    fontSize: 16,
    fontWeight: '600',
  },
  storeCardAddress: {
    fontSize: 13,
  },
  locationButton: {
    position: 'absolute',
    top: 60,
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
  },
  legend: {
    position: 'absolute',
    top: 60,
    left: 16,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  previewContent: {
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hotBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hotBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  premiumTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  premiumTagText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  storeAddress: {
    fontSize: 13,
  },
  storeInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  tapHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

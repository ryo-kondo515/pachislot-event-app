import { useRef, useState, useCallback } from 'react';
import { Text, View, Pressable, StyleSheet, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { MapView, Marker, PROVIDER_DEFAULT, isMapAvailable } from '@/components/map-view-wrapper';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { mockStores, getHotLevelColor, getHotLevelSize, getHotLevelLabel } from '@/data/mock-data';
import { Store, HotLevel } from '@/types';

const { width, height } = Dimensions.get('window');

// 東京駅を中心とした初期表示領域
const INITIAL_REGION = {
  latitude: 35.6812,
  longitude: 139.7671,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function MapScreen() {
  const colors = useColors();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const handleMarkerPress = useCallback((store: Store) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStore(store);
  }, []);

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
    // 現在地に移動（デモでは東京駅に戻る）
    if (mapRef.current) {
      mapRef.current.animateToRegion(INITIAL_REGION, 500);
    }
  }, []);

  const closePreview = useCallback(() => {
    setSelectedStore(null);
  }, []);

  // Web用の代替UI
  if (!isMapAvailable) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <View style={[styles.webFallback, { backgroundColor: colors.surface }]}>
          <IconSymbol name="map.fill" size={64} color={colors.muted} />
          <Text style={[styles.webFallbackTitle, { color: colors.foreground }]}>
            地図機能
          </Text>
          <Text style={[styles.webFallbackText, { color: colors.muted }]}>
            地図機能はモバイルアプリでご利用いただけます。{'\n'}
            Expo Goアプリでこのプロジェクトを開いてください。
          </Text>
          <View style={styles.storeList}>
            {mockStores.slice(0, 5).map((store) => (
              <Pressable
                key={store.id}
                onPress={() => router.push(`/store/${store.id}` as any)}
                style={({ pressed }) => [
                  styles.storeListItem,
                  { backgroundColor: colors.background },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View
                  style={[
                    styles.storeListDot,
                    { backgroundColor: getHotLevelColor(store.hotLevel) },
                  ]}
                />
                <View style={styles.storeListContent}>
                  <Text style={[styles.storeListName, { color: colors.foreground }]}>
                    {store.name}
                  </Text>
                  <Text style={[styles.storeListAddress, { color: colors.muted }]}>
                    {store.address}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // モバイル用の地図UI
  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={INITIAL_REGION}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedStore(null)}
      >
        {mockStores.map((store) => (
          <Marker
            key={store.id}
            coordinate={{
              latitude: store.latitude,
              longitude: store.longitude,
            }}
            onPress={() => handleMarkerPress(store)}
          >
            <View style={styles.markerContainer}>
              <View
                style={[
                  styles.marker,
                  {
                    backgroundColor: getHotLevelColor(store.hotLevel),
                    width: getHotLevelSize(store.hotLevel),
                    height: getHotLevelSize(store.hotLevel),
                    borderRadius: getHotLevelSize(store.hotLevel) / 2,
                  },
                ]}
              >
                <IconSymbol
                  name="flame.fill"
                  size={getHotLevelSize(store.hotLevel) * 0.5}
                  color="#FFFFFF"
                />
              </View>
              {store.isPremium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>★</Text>
                </View>
              )}
            </View>
          </Marker>
        ))}
      </MapView>

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
          {([5, 4, 3, 2, 1] as HotLevel[]).map((level) => (
            <View key={level} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: getHotLevelColor(level) },
                ]}
              />
              <Text style={[styles.legendText, { color: colors.muted }]}>
                {getHotLevelLabel(level)}
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
    width: width,
    height: height,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 10,
    color: '#000',
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
  // Web用フォールバックスタイル
  webFallback: {
    width: '100%',
    maxWidth: 500,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 16,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  webFallbackText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  storeList: {
    width: '100%',
    marginTop: 16,
    gap: 8,
  },
  storeListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  storeListDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  storeListContent: {
    flex: 1,
  },
  storeListName: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeListAddress: {
    fontSize: 12,
    marginTop: 2,
  },
});

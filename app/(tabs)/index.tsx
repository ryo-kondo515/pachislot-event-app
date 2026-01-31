import { useState, useCallback } from 'react';
import { Text, View, Pressable, StyleSheet, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { mockStores, getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';
import { Store, HotLevel } from '@/types';

type FilterType = 'all' | HotLevel;

export default function StoreListScreen() {
  const colors = useColors();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredStores = filter === 'all' 
    ? mockStores 
    : mockStores.filter(store => store.hotLevel === filter);

  const handleStorePress = useCallback((storeId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/store/${storeId}` as any);
  }, [router]);

  const handleFilterPress = useCallback((newFilter: FilterType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilter(newFilter);
  }, []);

  const renderStoreItem = useCallback(({ item }: { item: Store }) => (
    <Pressable
      onPress={() => handleStorePress(item.id)}
      style={({ pressed }) => [
        styles.storeCard,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.storeHeader}>
        <View style={styles.storeTitleRow}>
          <View
            style={[
              styles.hotIndicator,
              { backgroundColor: getHotLevelColor(item.hotLevel) },
            ]}
          />
          <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        {item.isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.gold }]}>
            <Text style={styles.premiumText}>優良店</Text>
          </View>
        )}
      </View>

      <View style={[styles.hotLevelBadge, { backgroundColor: getHotLevelColor(item.hotLevel) }]}>
        <IconSymbol name="flame.fill" size={16} color="#FFFFFF" />
        <Text style={styles.hotLevelText}>{getHotLevelLabel(item.hotLevel)}</Text>
      </View>

      <Text style={[styles.storeAddress, { color: colors.muted }]} numberOfLines={1}>
        📍 {item.address}
      </Text>

      <View style={styles.storeInfoRow}>
        <View style={styles.infoItem}>
          <IconSymbol name="clock.fill" size={14} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            {item.openingHours}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <IconSymbol name="flame.fill" size={14} color={colors.muted} />
          <Text style={[styles.infoText, { color: colors.muted }]}>
            {item.machineCount}台
          </Text>
        </View>
      </View>

      <View style={[styles.viewDetailHint, { borderTopColor: colors.border }]}>
        <Text style={[styles.viewDetailText, { color: colors.primary }]}>
          詳細を見る
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.primary} />
      </View>
    </Pressable>
  ), [colors, handleStorePress]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.foreground }]}>
        店舗一覧
      </Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>
        {filteredStores.length}件の店舗
      </Text>

      {/* フィルターボタン */}
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => handleFilterPress('all')}
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'all' && { backgroundColor: colors.primary },
            !filter && { backgroundColor: colors.surface },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text
            style={[
              styles.filterButtonText,
              filter === 'all' ? { color: '#FFFFFF' } : { color: colors.muted },
            ]}
          >
            すべて
          </Text>
        </Pressable>

        {([5, 4, 3, 2, 1] as HotLevel[]).map((level) => (
          <Pressable
            key={level}
            onPress={() => handleFilterPress(level)}
            style={({ pressed }) => [
              styles.filterButton,
              filter === level && { backgroundColor: getHotLevelColor(level) },
              filter !== level && { backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                filter === level ? { color: '#FFFFFF' } : { color: colors.muted },
              ]}
            >
              {getHotLevelLabel(level)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <FlatList
        data={filteredStores}
        renderItem={renderStoreItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  storeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  hotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
  },
  hotLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  hotLevelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  storeAddress: {
    fontSize: 14,
    marginBottom: 12,
  },
  storeInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
  },
  viewDetailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

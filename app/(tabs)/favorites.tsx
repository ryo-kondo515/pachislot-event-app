import { useState, useCallback } from 'react';
import { Text, View, FlatList, Pressable, StyleSheet, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { useFavorites } from '@/hooks/use-favorites';
import { mockActors } from '@/data/mock-data';
import { Actor } from '@/types';

type TabType = 'actors' | 'areas' | 'machines';

// デモ用のお気に入りエリア
const mockFavoriteAreas = [
  { id: 'area-1', name: '新宿エリア', storeCount: 12 },
  { id: 'area-2', name: '渋谷エリア', storeCount: 8 },
  { id: 'area-3', name: '池袋エリア', storeCount: 15 },
];

// デモ用のお気に入り機種
const mockFavoriteMachines = [
  { id: 'machine-1', name: 'ジャグラー', type: 'Aタイプ' },
  { id: 'machine-2', name: 'バジリスク', type: 'AT' },
  { id: 'machine-3', name: '北斗の拳', type: 'AT' },
];

export default function FavoritesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('actors');
  const {
    favoriteActors,
    favoriteAreas,
    favoriteMachines,
    loading,
    toggleFavoriteActor,
    toggleFavoriteArea,
    toggleFavoriteMachine,
  } = useFavorites();

  const handleTabChange = useCallback((tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
  }, []);

  const handleToggleFavoriteActor = useCallback((actorId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavoriteActor(actorId);
  }, [toggleFavoriteActor]);

  const renderActorItem = useCallback(
    ({ item }: { item: Actor }) => {
      const isFavorite = favoriteActors.includes(item.id);
      return (
        <View style={[styles.listItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <IconSymbol name="person.fill" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.foreground }]}>
              {item.name}
            </Text>
            <Text style={[styles.itemSubtitle, { color: colors.gold }]}>
              ランクスコア: {item.rankScore}
            </Text>
          </View>
          <Pressable
            onPress={() => handleToggleFavoriteActor(item.id)}
            style={({ pressed }) => [
              styles.favoriteButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol
              name="heart.fill"
              size={24}
              color={isFavorite ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>
      );
    },
    [colors, favoriteActors, handleToggleFavoriteActor]
  );

  const renderAreaItem = useCallback(
    ({ item }: { item: (typeof mockFavoriteAreas)[0] }) => (
      <View style={[styles.listItem, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.neonCyan }]}>
          <IconSymbol name="location.fill" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.muted }]}>
            {item.storeCount}店舗
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      </View>
    ),
    [colors]
  );

  const renderMachineItem = useCallback(
    ({ item }: { item: (typeof mockFavoriteMachines)[0] }) => (
      <View style={[styles.listItem, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.gold }]}>
          <IconSymbol name="flame.fill" size={24} color="#000000" />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.muted }]}>
            {item.type}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={colors.muted} />
      </View>
    ),
    [colors]
  );

  return (
    <ScreenContainer className="flex-1">
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          お気に入り
        </Text>
      </View>

      {/* タブ切り替え */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        {[
          { key: 'actors' as TabType, label: '演者' },
          { key: 'areas' as TabType, label: 'エリア' },
          { key: 'machines' as TabType, label: '機種' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleTabChange(tab.key)}
            style={({ pressed }) => [
              styles.tab,
              activeTab === tab.key && [
                styles.activeTab,
                { backgroundColor: colors.primary },
              ],
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? '#FFFFFF' : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* リスト表示 */}
      {activeTab === 'actors' && (
        <FlatList
          data={mockActors}
          renderItem={renderActorItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'areas' && (
        <FlatList
          data={mockFavoriteAreas}
          renderItem={renderAreaItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {activeTab === 'machines' && (
        <FlatList
          data={mockFavoriteMachines}
          renderItem={renderMachineItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 8,
  },
});

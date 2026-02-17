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

const mockFavoriteAreas = [
  { id: 'area-1', name: '新宿エリア', storeCount: 12 },
  { id: 'area-2', name: '渋谷エリア', storeCount: 8 },
  { id: 'area-3', name: '池袋エリア', storeCount: 15 },
];

const mockFavoriteMachines = [
  { id: 'machine-1', name: 'ジャグラー', type: 'Aタイプ' },
  { id: 'machine-2', name: 'バジリスク', type: 'AT' },
  { id: 'machine-3', name: '北斗の拳', type: 'AT' },
];

const TAB_CONFIG: { key: TabType; label: string; icon: string; emptyTitle: string; emptySubtitle: string }[] = [
  { key: 'actors', label: '演者', icon: 'person.fill', emptyTitle: 'お気に入り演者がいません', emptySubtitle: '気になる演者をお気に入りに追加しましょう' },
  { key: 'areas', label: 'エリア', icon: 'location.fill', emptyTitle: 'お気に入りエリアがありません', emptySubtitle: 'よく行くエリアを登録しましょう' },
  { key: 'machines', label: '機種', icon: 'flame.fill', emptyTitle: 'お気に入り機種がありません', emptySubtitle: 'お気に入りの機種を登録しましょう' },
];

export default function FavoritesScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<TabType>('actors');
  const {
    favoriteActors,
    toggleFavoriteActor,
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

  const activeTabConfig = TAB_CONFIG.find(t => t.key === activeTab)!;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconBg, { backgroundColor: colors.surface }]}>
        <IconSymbol name={activeTabConfig.icon as any} size={36} color={colors.muted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {activeTabConfig.emptyTitle}
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
        {activeTabConfig.emptySubtitle}
      </Text>
    </View>
  );

  const renderActorItem = useCallback(
    ({ item }: { item: Actor }) => {
      const isFavorite = favoriteActors.includes(item.id);
      return (
        <View style={[styles.listItem, { backgroundColor: colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: `${colors.primary}25` }]}>
            <IconSymbol name="person.fill" size={22} color={colors.primary} />
          </View>
          <View style={styles.itemContent}>
            <Text style={[styles.itemTitle, { color: colors.foreground }]}>
              {item.name}
            </Text>
            <View style={styles.rankRow}>
              <IconSymbol name="star.fill" size={12} color={colors.gold} />
              <Text style={[styles.itemSubtitle, { color: colors.gold }]}>
                スコア: {item.rankScore}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleToggleFavoriteActor(item.id)}
            style={({ pressed }) => [
              styles.favoriteButton,
              pressed && { opacity: 0.6, transform: [{ scale: 0.9 }] },
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
        <View style={[styles.avatar, { backgroundColor: `${colors.neonCyan}20` }]}>
          <IconSymbol name="location.fill" size={22} color={colors.neonCyan} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <Text style={[styles.itemSubtitle, { color: colors.muted }]}>
            {item.storeCount}店舗
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
      </View>
    ),
    [colors]
  );

  const renderMachineItem = useCallback(
    ({ item }: { item: (typeof mockFavoriteMachines)[0] }) => (
      <View style={[styles.listItem, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: `${colors.gold}20` }]}>
          <IconSymbol name="flame.fill" size={22} color={colors.gold} />
        </View>
        <View style={styles.itemContent}>
          <Text style={[styles.itemTitle, { color: colors.foreground }]}>
            {item.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: `${colors.muted}20` }]}>
            <Text style={[styles.typeText, { color: colors.muted }]}>
              {item.type}
            </Text>
          </View>
        </View>
        <IconSymbol name="chevron.right" size={18} color={colors.muted} />
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
        {TAB_CONFIG.map((tab) => (
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
            <IconSymbol
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#FFFFFF' : colors.muted}
            />
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
        mockActors.length > 0 ? (
          <FlatList
            data={mockActors}
            renderItem={renderActorItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : renderEmptyState()
      )}

      {activeTab === 'areas' && (
        mockFavoriteAreas.length > 0 ? (
          <FlatList
            data={mockFavoriteAreas}
            renderItem={renderAreaItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : renderEmptyState()
      )}

      {activeTab === 'machines' && (
        mockFavoriteMachines.length > 0 ? (
          <FlatList
            data={mockFavoriteMachines}
            renderItem={renderMachineItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : renderEmptyState()
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
    borderRadius: 14,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
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
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    marginTop: 3,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, ScrollView, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { LoadingState } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { useColors } from '@/hooks/use-colors';
import { getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';
import { trpc } from '@/lib/trpc';
import { useFavorites } from '@/hooks/use-favorites';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { toggleFavoriteStore, isFavoriteStore } = useFavorites();

  const { data: storeDetail, isLoading, error } = trpc.stores.detail.useQuery(
    { storeId: parseInt(id, 10) },
    { enabled: !!id && !isNaN(parseInt(id, 10)) }
  );

  const handleToggleFavorite = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    toggleFavoriteStore(id);
  };

  const isFavorite = isFavoriteStore(id);

  if (isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="店舗情報を読み込んでいます..." />
      </ScreenContainer>
    );
  }

  if (error || !storeDetail) {
    return (
      <ScreenContainer>
        <ErrorState
          title="店舗情報の取得に失敗しました"
          message={error?.message || '店舗が見つかりませんでした。URLが正しいか確認してください。'}
          onRetry={() => router.back()}
          retryLabel="戻る"
        />
      </ScreenContainer>
    );
  }

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handleOpenLink = (url: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Linking.openURL(url);
  };

  const topHotLevel = storeDetail.events.length > 0
    ? Math.max(...storeDetail.events.map(e => e.hotLevel))
    : null;

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.background },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.foreground} />
          </Pressable>

          <Pressable
            onPress={handleToggleFavorite}
            style={({ pressed }) => [
              styles.favoriteButton,
              { backgroundColor: colors.background },
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol
              name={isFavorite ? "heart.fill" : "heart"}
              size={22}
              color={isFavorite ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>

        {/* 店舗情報カード */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* プレミアム + アツさバッジ */}
          <View style={styles.badgeRow}>
            {storeDetail.isPremium === 1 && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.gold }]}>
                <IconSymbol name="star.fill" size={12} color="#000000" />
                <Text style={styles.premiumBadgeText}>優良店</Text>
              </View>
            )}
            {topHotLevel !== null && (
              <View style={[styles.hotLevelBadge, { backgroundColor: getHotLevelColor(topHotLevel as any) }]}>
                <IconSymbol name="flame.fill" size={12} color="#FFFFFF" />
                <Text style={styles.hotLevelBadgeText}>
                  {getHotLevelLabel(topHotLevel as any)}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.storeName, { color: colors.foreground }]}>
            {storeDetail.name}
          </Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: `${colors.neonCyan}20` }]}>
                <IconSymbol name="location.fill" size={14} color={colors.neonCyan} />
              </View>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                {storeDetail.address}
              </Text>
            </View>
            {storeDetail.openingTime && storeDetail.closingTime && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBg, { backgroundColor: `${colors.success}20` }]}>
                  <IconSymbol name="clock.fill" size={14} color={colors.success} />
                </View>
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  {storeDetail.openingTime} - {storeDetail.closingTime}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBg, { backgroundColor: `${colors.warning}20` }]}>
                <IconSymbol name="flame.fill" size={14} color={colors.warning} />
              </View>
              <Text style={[styles.infoText, { color: colors.muted }]}>
                設置台数: {storeDetail.machineCount}台
              </Text>
            </View>
          </View>
        </View>

        {/* イベント情報 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="calendar.fill" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              来店イベント情報
            </Text>
            {storeDetail.events.length > 0 && (
              <View style={[styles.eventCount, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.eventCountText, { color: colors.primary }]}>
                  {storeDetail.events.length}件
                </Text>
              </View>
            )}
          </View>

          {storeDetail.events.length > 0 ? (
            <View style={styles.eventList}>
              {storeDetail.events.map((event) => (
                <View
                  key={event.id}
                  style={[styles.eventCard, {
                    borderColor: colors.border,
                    borderLeftColor: getHotLevelColor(event.hotLevel as any),
                  }]}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventDate}>
                      <IconSymbol name="calendar.fill" size={14} color={colors.primary} />
                      <Text style={[styles.eventDateText, { color: colors.primary }]}>
                        {new Date(event.eventDate).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.hotBadge, { backgroundColor: getHotLevelColor(event.hotLevel as any) }]}>
                      <IconSymbol name="flame.fill" size={10} color="#FFFFFF" />
                      <Text style={styles.hotBadgeText}>
                        {getHotLevelLabel(event.hotLevel as any)}
                      </Text>
                    </View>
                  </View>

                  {event.actor && (
                    <View style={styles.actorInfo}>
                      <View style={[styles.actorAvatar, { backgroundColor: `${colors.primary}30` }]}>
                        <IconSymbol name="person.fill" size={18} color={colors.primary} />
                      </View>
                      <View style={styles.actorDetails}>
                        <Text style={[styles.actorName, { color: colors.foreground }]}>
                          {event.actor.name}
                        </Text>
                        <View style={styles.rankRow}>
                          <IconSymbol name="star.fill" size={12} color={colors.gold} />
                          <Text style={[styles.actorRank, { color: colors.gold }]}>
                            スコア: {event.actor.rankScore}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {storeDetail.officialUrl && (
                    <Pressable
                      onPress={() => handleOpenLink(storeDetail.officialUrl!)}
                      style={({ pressed }) => [
                        styles.linkButton,
                        { backgroundColor: `${colors.primary}15` },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <IconSymbol name="link" size={14} color={colors.primary} />
                      <Text style={[styles.linkText, { color: colors.primary }]}>
                        公式HPを見る
                      </Text>
                      <IconSymbol name="chevron.right" size={12} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBg, { backgroundColor: `${colors.muted}15` }]}>
                <IconSymbol name="calendar.fill" size={32} color={colors.muted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                イベント予定なし
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                現在予定されているイベントはありません
              </Text>
            </View>
          )}
        </View>

        {/* 広告エリア */}
        <View style={[styles.adBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.adText, { color: colors.muted }]}>広告エリア</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  hotLevelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  hotLevelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoSection: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  eventCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventList: {
    gap: 12,
  },
  eventCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDateText: {
    fontSize: 14,
    fontWeight: '600',
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
  actorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actorDetails: {
    flex: 1,
  },
  actorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  actorRank: {
    fontSize: 12,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  adBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 32,
  },
});

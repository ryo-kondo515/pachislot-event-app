import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text, View, ScrollView, Pressable, StyleSheet, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScreenContainer } from '@/components/screen-container';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColors } from '@/hooks/use-colors';
import { getStoreDetail, getHotLevelColor, getHotLevelLabel } from '@/data/mock-data';

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const storeDetail = getStoreDetail(id);

  if (!storeDetail) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text style={{ color: colors.foreground }}>店舗が見つかりません</Text>
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

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* ヘッダー */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.foreground} />
            <Text style={[styles.backText, { color: colors.foreground }]}>戻る</Text>
          </Pressable>
        </View>

        {/* 店舗情報カード */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.hotBadge,
                { backgroundColor: getHotLevelColor(storeDetail.hotLevel) },
              ]}
            >
              <IconSymbol name="flame.fill" size={14} color="#FFFFFF" />
              <Text style={styles.hotBadgeText}>
                {getHotLevelLabel(storeDetail.hotLevel)}
              </Text>
            </View>
            {storeDetail.isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: colors.gold }]}>
                <Text style={styles.premiumBadgeText}>★ 優良店</Text>
              </View>
            )}
          </View>

          <Text style={[styles.storeName, { color: colors.foreground }]}>
            {storeDetail.name}
          </Text>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <IconSymbol name="location.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.muted }]}>
                {storeDetail.address}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol name="clock.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.muted }]}>
                営業時間: {storeDetail.openingHours}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <IconSymbol name="flame.fill" size={16} color={colors.muted} />
              <Text style={[styles.infoText, { color: colors.muted }]}>
                設置台数: {storeDetail.machineCount}台
              </Text>
            </View>
          </View>
        </View>

        {/* イベント情報 */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            来店イベント情報
          </Text>

          {storeDetail.events.length > 0 ? (
            <View style={styles.eventList}>
              {storeDetail.events.map((event) => (
                <View
                  key={event.id}
                  style={[styles.eventCard, { borderColor: colors.border }]}
                >
                  <View style={styles.eventHeader}>
                    <View style={styles.eventDate}>
                      <IconSymbol name="clock.fill" size={14} color={colors.primary} />
                      <Text style={[styles.eventDateText, { color: colors.primary }]}>
                        {event.eventDate}
                      </Text>
                    </View>
                    <View style={[styles.sourceTag, { backgroundColor: colors.background }]}>
                      <Text style={[styles.sourceText, { color: colors.muted }]}>
                        {event.sourceName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.actorInfo}>
                    <View style={[styles.actorAvatar, { backgroundColor: colors.primary }]}>
                      <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.actorDetails}>
                      <Text style={[styles.actorName, { color: colors.foreground }]}>
                        {event.actor.name}
                      </Text>
                      <Text style={[styles.actorRank, { color: colors.gold }]}>
                        ランクスコア: {event.actor.rankScore}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleOpenLink(event.sourceUrl)}
                    style={({ pressed }) => [
                      styles.linkButton,
                      { backgroundColor: colors.background },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <IconSymbol name="link" size={14} color={colors.primary} />
                    <Text style={[styles.linkText, { color: colors.primary }]}>
                      ソースを確認
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol name="info.circle.fill" size={32} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                現在予定されているイベントはありません
              </Text>
            </View>
          )}
        </View>

        {/* 広告エリア（プレースホルダー） */}
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
    padding: 16,
    marginBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  hotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hotBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  premiumBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoSection: {
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  eventList: {
    gap: 12,
  },
  eventCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
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
  sourceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceText: {
    fontSize: 11,
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
  actorRank: {
    fontSize: 12,
    marginTop: 2,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
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

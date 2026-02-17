import { Text, View, FlatList, Pressable, StyleSheet, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { getHotLevelColor, getHotLevelLabel } from "@/data/mock-data";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

interface EventWithDetails {
  id: number;
  storeId: number;
  actorId: number | null;
  eventDate: Date;
  hotLevel: number;
  machineType: string | null;
  description: string | null;
  sourceUrl: string | null;
  store: {
    id: number;
    name: string;
    address: string;
  } | null;
  actor: {
    id: number;
    name: string;
  } | null;
}

export default function EventsScreen() {
  const colors = useColors();
  const router = useRouter();

  const eventsQuery = trpc.events.list.useQuery();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  const isToday = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
  };

  const handleEventPress = (storeId: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/store/${storeId}` as any);
  };

  const renderEventItem = ({ item }: { item: EventWithDetails }) => {
    const hotColor = getHotLevelColor(item.hotLevel as any);
    const today = isToday(item.eventDate);

    return (
      <Pressable
        onPress={() => item.store && handleEventPress(item.store.id)}
        disabled={!item.store}
        style={({ pressed }) => [
          styles.eventCard,
          {
            backgroundColor: colors.surface,
            borderLeftColor: hotColor,
          },
          pressed && styles.eventCardPressed,
        ]}
      >
        {/* 日付行 */}
        <View style={styles.dateRow}>
          <View style={styles.dateContainer}>
            <IconSymbol name="calendar.fill" size={14} color={today ? colors.primary : colors.muted} />
            <Text style={[
              styles.dateText,
              { color: today ? colors.primary : colors.foreground },
            ]}>
              {formatDate(item.eventDate)}
            </Text>
            {today && (
              <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </View>
          <View style={[styles.hotBadge, { backgroundColor: hotColor }]}>
            <IconSymbol name="flame.fill" size={10} color="#FFFFFF" />
            <Text style={styles.hotBadgeText}>
              {getHotLevelLabel(item.hotLevel as any)}
            </Text>
          </View>
        </View>

        {/* 店舗名 */}
        {item.store && (
          <Text style={[styles.storeName, { color: colors.foreground }]} numberOfLines={1}>
            {item.store.name}
          </Text>
        )}

        {/* 住所 */}
        {item.store && (
          <View style={styles.addressRow}>
            <IconSymbol name="location.fill" size={12} color={colors.muted} />
            <Text style={[styles.addressText, { color: colors.muted }]} numberOfLines={1}>
              {item.store.address}
            </Text>
          </View>
        )}

        {/* 演者・機種情報 */}
        <View style={styles.detailsRow}>
          {item.actor && (
            <View style={[styles.detailChip, { backgroundColor: `${colors.primary}20` }]}>
              <IconSymbol name="person.fill" size={12} color={colors.primary} />
              <Text style={[styles.detailChipText, { color: colors.primary }]}>
                {item.actor.name}
              </Text>
            </View>
          )}
          {item.machineType && (
            <View style={[styles.detailChip, { backgroundColor: `${colors.neonCyan}20` }]}>
              <IconSymbol name="flame.fill" size={12} color={colors.neonCyan} />
              <Text style={[styles.detailChipText, { color: colors.neonCyan }]}>
                {item.machineType}
              </Text>
            </View>
          )}
        </View>

        {/* 説明 */}
        {item.description && (
          <Text style={[styles.description, { color: colors.muted }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* タップヒント */}
        {item.store && (
          <View style={[styles.tapHint, { borderTopColor: colors.border }]}>
            <Text style={[styles.tapHintText, { color: colors.primary }]}>
              店舗詳細を見る
            </Text>
            <IconSymbol name="chevron.right" size={14} color={colors.primary} />
          </View>
        )}
      </Pressable>
    );
  };

  if (eventsQuery.isLoading) {
    return (
      <ScreenContainer>
        <LoadingState message="イベント情報を読み込んでいます..." />
      </ScreenContainer>
    );
  }

  if (eventsQuery.error) {
    return (
      <ScreenContainer>
        <ErrorState
          title="イベント情報の取得に失敗しました"
          message={eventsQuery.error.message || 'ネットワーク接続を確認してください。'}
          onRetry={() => eventsQuery.refetch()}
        />
      </ScreenContainer>
    );
  }

  const events = eventsQuery.data || [];

  return (
    <ScreenContainer className="flex-1">
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          イベント一覧
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
          今日以降のイベント情報
        </Text>
        {events.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
            <Text style={[styles.countText, { color: colors.primary }]}>
              {events.length}件
            </Text>
          </View>
        )}
      </View>

      {events.length > 0 ? (
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <IconSymbol name="calendar.fill" size={40} color={colors.muted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            イベント情報がありません
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            新しいイベントが登録されるとここに表示されます
          </Text>
        </View>
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
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  countBadge: {
    position: 'absolute',
    right: 16,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  eventCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 14,
    borderLeftWidth: 4,
  },
  eventCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 4,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  detailChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  tapHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
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

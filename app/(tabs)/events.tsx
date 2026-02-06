import { ScrollView, Text, View, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import { getHotLevelColor, getHotLevelLabel } from "@/data/mock-data";

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

  // イベント一覧を取得
  const eventsQuery = trpc.events.list.useQuery();

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return `${month}月${day}日(${weekday})`;
  };

  const renderEventItem = ({ item }: { item: EventWithDetails }) => {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 16,
          marginBottom: 12,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        {/* イベント日付とアツさレベル */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
            {formatDate(item.eventDate)}
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: getHotLevelColor(item.hotLevel as any),
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>
              {getHotLevelLabel(item.hotLevel as any)}
            </Text>
          </View>
        </View>

        {/* 店舗名 */}
        {item.store && (
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
            {item.store.name}
          </Text>
        )}

        {/* 住所 */}
        {item.store && (
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8 }}>
            {item.store.address}
          </Text>
        )}

        {/* 演者情報 */}
        {item.actor && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Text style={{ fontSize: 14, color: colors.primary, fontWeight: "600" }}>
              演者: {item.actor.name}
            </Text>
          </View>
        )}

        {/* 機種タイプ */}
        {item.machineType && (
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
            機種: {item.machineType}
          </Text>
        )}

        {/* 説明 */}
        {item.description && (
          <Text style={{ fontSize: 13, color: colors.foreground, marginTop: 8 }}>
            {item.description}
          </Text>
        )}
      </View>
    );
  };

  if (eventsQuery.isLoading) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
          イベント情報を読み込んでいます...
        </Text>
      </ScreenContainer>
    );
  }

  if (eventsQuery.error) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ fontSize: 16, color: colors.error, textAlign: "center" }}>
          エラーが発生しました: {eventsQuery.error.message}
        </Text>
      </ScreenContainer>
    );
  }

  const events = eventsQuery.data || [];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
          イベント一覧
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          今日以降のイベント情報
        </Text>

        {events.length > 0 ? (
          <FlatList
            data={events}
            renderItem={renderEventItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center", marginTop: 40 }}>
            イベント情報がありません
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

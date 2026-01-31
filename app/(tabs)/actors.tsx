import { ScrollView, Text, View, TouchableOpacity, FlatList, Pressable } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface Actor {
  id: number;
  name: string;
  rankScore: number;
  eventCount: number;
}

const FAVORITE_ACTORS_KEY = "@favorite_actors";

export default function ActorsScreen() {
  const colors = useColors();
  const [favoriteActorIds, setFavoriteActorIds] = useState<number[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);

  // お気に入り演者をAsyncStorageから読み込む
  useEffect(() => {
    loadFavoriteActors();
  }, []);

  // 演者一覧を取得
  const actorsQuery = trpc.actors.list.useQuery();
  const rankingsQuery = trpc.actors.rankings.useQuery({ limit: 10 });

  useEffect(() => {
    if (actorsQuery.data) {
      setActors(actorsQuery.data);
      setLoading(false);
    }
  }, [actorsQuery.data]);

  const loadFavoriteActors = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITE_ACTORS_KEY);
      if (stored) {
        setFavoriteActorIds(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load favorite actors:", error);
    }
  };

  const toggleFavorite = async (actorId: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      let newFavorites: number[];
      if (favoriteActorIds.includes(actorId)) {
        newFavorites = favoriteActorIds.filter(id => id !== actorId);
      } else {
        newFavorites = [...favoriteActorIds, actorId];
      }
      
      setFavoriteActorIds(newFavorites);
      await AsyncStorage.setItem(FAVORITE_ACTORS_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error("Failed to save favorite actors:", error);
    }
  };

  const renderActorItem = ({ item }: { item: Actor }) => {
    const isFavorite = favoriteActorIds.includes(item.id);
    
    return (
      <TouchableOpacity
        onPress={() => toggleFavorite(item.id)}
        style={{
          backgroundColor: colors.surface,
          padding: 16,
          marginBottom: 12,
          borderRadius: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderWidth: isFavorite ? 2 : 0,
          borderColor: colors.primary,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>
            来店回数: {item.eventCount}回 | ランク: {item.rankScore.toFixed(1)}
          </Text>
        </View>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: isFavorite ? colors.primary : colors.border,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 20, color: isFavorite ? "#FFF" : colors.muted }}>
            {isFavorite ? "★" : "☆"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || actorsQuery.isLoading) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center" }}>
          演者情報を読み込んでいます...
        </Text>
      </ScreenContainer>
    );
  }

  if (actorsQuery.error) {
    return (
      <ScreenContainer className="p-6">
        <Text style={{ fontSize: 16, color: colors.error, textAlign: "center" }}>
          エラーが発生しました: {actorsQuery.error.message}
        </Text>
      </ScreenContainer>
    );
  }

  const favoriteActors = actors.filter(a => favoriteActorIds.includes(a.id));
  const otherActors = actors.filter(a => !favoriteActorIds.includes(a.id));
  const rankings = rankingsQuery.data || [];

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* ランキングセクション */}
        {rankings.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              演者ランキング TOP 10
            </Text>
            {rankings.map((actor, index) => (
              <View
                key={actor.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  marginBottom: 8,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.primary, marginRight: 12, width: 32 }}>
                  {index + 1}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
                    {actor.name}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.muted }}>
                    スコア: {actor.rankScore} | 来店回数: {actor.eventCount}回
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggleFavorite(actor.id)}
                  style={({ pressed }) => [
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <IconSymbol
                    name="heart.fill"
                    size={24}
                    color={favoriteActorIds.includes(actor.id) ? colors.error : colors.muted}
                  />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* 全演者一覧 */}
        <Text style={{ fontSize: 24, fontWeight: "bold", color: colors.foreground, marginBottom: 8 }}>
          全演者一覧
        </Text>
        <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
          タップしてお気に入りに追加
        </Text>

        {favoriteActors.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12 }}>
              お気に入り演者
            </Text>
            <FlatList
              data={favoriteActors}
              renderItem={renderActorItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}

        {otherActors.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground, marginBottom: 12, marginTop: 20 }}>
              すべての演者
            </Text>
            <FlatList
              data={otherActors}
              renderItem={renderActorItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          </>
        )}

        {actors.length === 0 && (
          <Text style={{ fontSize: 16, color: colors.muted, textAlign: "center", marginTop: 40 }}>
            演者情報がありません
          </Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

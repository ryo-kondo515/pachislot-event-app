import { getDb } from "./db-postgres";
import { actors, events } from "../drizzle/schema-postgres";
import { eq, sql } from "drizzle-orm";

/**
 * 演者ランキングスコアを計算する
 * 
 * スコア計算式:
 * - 来店頻度: 1イベント = 10ポイント
 * - 最近の来店: 30日以内 = +20ポイント、60日以内 = +10ポイント
 * - 基本スコア: 100ポイント
 */
export async function calculateActorRankings() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 演者ごとの来店回数を集計
  const actorStats = await db
    .select({
      actorId: events.actorId,
      eventCount: sql<number>`COUNT(*)`.as("eventCount"),
      latestEventDate: sql<Date>`MAX(${events.eventDate})`.as("latestEventDate"),
    })
    .from(events)
    .where(sql`${events.actorId} IS NOT NULL`)
    .groupBy(events.actorId);

  // 各演者のランキングスコアを計算
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (const stats of actorStats) {
    if (!stats.actorId) continue;

    let rankScore = 100; // 基本スコア

    // 来店頻度スコア
    rankScore += stats.eventCount * 10;

    // 最近の来店スコア
    const latestDate = new Date(stats.latestEventDate);
    if (latestDate >= thirtyDaysAgo) {
      rankScore += 20;
    } else if (latestDate >= sixtyDaysAgo) {
      rankScore += 10;
    }

    // データベースを更新
    await db
      .update(actors)
      .set({ rankScore })
      .where(eq(actors.id, stats.actorId));
  }

  return {
    success: true,
    actorsUpdated: actorStats.length,
  };
}

/**
 * 演者ランキングを取得する
 */
export async function getActorRankings(limit: number = 10) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // ランキングスコアでソートして取得
  const rankings = await db
    .select({
      id: actors.id,
      name: actors.name,
      rankScore: actors.rankScore,
      imageUrl: actors.imageUrl,
    })
    .from(actors)
    .orderBy(sql`${actors.rankScore} DESC`)
    .limit(limit);

  // 各演者の来店回数を取得
  const rankingsWithStats = await Promise.all(
    rankings.map(async (actor) => {
      const eventCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(events)
        .where(eq(events.actorId, actor.id));

      return {
        ...actor,
        eventCount: eventCount[0]?.count || 0,
      };
    })
  );

  return rankingsWithStats;
}

import { publicProcedure, router } from "./_core/trpc";
import { calculateActorRankings, getActorRankings } from "./ranking";
import { z } from "zod";
import { getDb } from "./db";
import { actors, events } from "../drizzle/schema";
import { eq, sql, desc } from "drizzle-orm";

export const actorsRouter = router({
  /**
   * 演者一覧を取得（来店回数とランクスコア付き）
   */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // 演者ごとの来店回数を集計
    const actorEvents = await db
      .select({
        actorId: events.actorId,
        eventCount: sql<number>`COUNT(*)`.as("eventCount"),
      })
      .from(events)
      .where(sql`${events.actorId} IS NOT NULL`)
      .groupBy(events.actorId);

    // 演者情報を取得
    const allActors = await db.select().from(actors);

    // 来店回数とランクスコアを結合
    const actorsWithStats = allActors.map((actor) => {
      const stats = actorEvents.find((e) => e.actorId === actor.id);
      return {
        id: actor.id,
        name: actor.name,
        rankScore: actor.rankScore || 0,
        eventCount: stats?.eventCount || 0,
      };
    });

    // ランクスコアでソート
    return actorsWithStats.sort((a, b) => b.rankScore - a.rankScore);
  }),

  /**
   * 演者の詳細情報を取得
   */
  getById: publicProcedure
    .input((val: unknown) => {
      if (typeof val === "number") return val;
      throw new Error("Invalid input: expected number");
    })
    .query(async ({ input: actorId }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const actor = await db.select().from(actors).where(eq(actors.id, actorId)).limit(1);
      if (!actor || actor.length === 0) {
        throw new Error("Actor not found");
      }

      // 演者のイベント一覧を取得
      const actorEvents = await db
        .select()
        .from(events)
        .where(eq(events.actorId, actorId))
        .orderBy(desc(events.eventDate));

      return {
        ...actor[0],
        events: actorEvents,
      };
    }),

  // 演者ランキングを取得
  rankings: publicProcedure
    .input(z.object({ limit: z.number().optional().default(10) }).optional())
    .query(async ({ input }) => {
      return await getActorRankings(input?.limit || 10);
    }),

  // ランキングスコアを再計算
  calculateRankings: publicProcedure.mutation(async () => {
    return await calculateActorRankings();
  }),
});

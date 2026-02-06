import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { scraperRouter } from "./routers-scraper";
import { actorsRouter } from "./routers-actors";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      // ログアウトはクライアント側の supabase.auth.signOut() で処理される
      return { success: true } as const;
    }),
  }),

  stores: router({
    detail: publicProcedure
      .input(z.object({ storeId: z.number() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db-postgres");
        const { stores, events, actors } = await import("../drizzle/schema-postgres");
        const { eq, and, gte, lte } = await import("drizzle-orm");

        const db = await getDb();
        if (!db) {
          return null;
        }

        // 店舗情報を取得
        const storeList = await db
          .select()
          .from(stores)
          .where(eq(stores.id, input.storeId))
          .limit(1);
        
        if (storeList.length === 0) {
          return null;
        }

        const store = storeList[0];

        // 当日の日付を取得（日本時間）
        const now = new Date();
        const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
        const jstDate = new Date(now.getTime() + jstOffset);
        // UTC基準で日付範囲を計算
        const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        // 当日のイベントを取得
        const todayEvents = await db
          .select()
          .from(events)
          .where(
            and(
              eq(events.storeId, input.storeId),
              gte(events.eventDate, todayStart),
              lte(events.eventDate, todayEnd)
            )
          );

        // 演者情報を取得
        const eventsWithActors = await Promise.all(
          todayEvents.map(async (event) => {
            if (event.actorId) {
              const actorList = await db
                .select()
                .from(actors)
                .where(eq(actors.id, event.actorId))
                .limit(1);
              return {
                ...event,
                actor: actorList[0] || null,
              };
            }
            return { ...event, actor: null };
          })
        );

        return {
          ...store,
          events: eventsWithActors,
        };
      }),
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db-postgres");
      const { stores, events, actors } = await import("../drizzle/schema-postgres");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return [];
      }

      // 当日の日付を取得（日本時間）
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
      const jstDate = new Date(now.getTime() + jstOffset);
      // UTC基準で日付範囲を計算
      const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // 当日のイベントを取得
      const todayEvents = await db
        .select()
        .from(events)
        .where(
          and(
            gte(events.eventDate, todayStart),
            lte(events.eventDate, todayEnd)
          )
        );

      // 当日のイベントがある店舗IDを取得
      const storeIdsWithEvents = [...new Set(todayEvents.map(e => e.storeId))];

      if (storeIdsWithEvents.length === 0) {
        return [];
      }

      // 当日のイベントがある店舗のみを取得
      const storesList = await db.select().from(stores);
      const storesWithTodayEvents = storesList.filter(store => 
        storeIdsWithEvents.includes(store.id)
      );

      // 各店舗のイベント情報を取得
      const result = await Promise.all(
        storesWithTodayEvents.map(async (store) => {
          const storeEvents = todayEvents.filter(e => e.storeId === store.id);

          // 演者情報を取得
          const eventsWithActors = await Promise.all(
            storeEvents.map(async (event) => {
              if (event.actorId) {
                const actorList = await db
                  .select()
                  .from(actors)
                  .where(eq(actors.id, event.actorId))
                  .limit(1);
                return {
                  ...event,
                  actor: actorList[0] || null,
                };
              }
              return { ...event, actor: null };
            })
          );

          return {
            ...store,
            events: eventsWithActors,
          };
        })
      );

      return result;
    }),
  }),

  scraper: scraperRouter,
  actors: actorsRouter,

  events: router({
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db-postgres");
      const { events, stores, actors } = await import("../drizzle/schema-postgres");
      const { eq, gte, and, desc } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) {
        return [];
      }

      // 当日の日付を取得（日本時間）
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
      const jstDate = new Date(now.getTime() + jstOffset);
      // UTC基準で日付範囲を計算
      const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);

      // 今日以降のイベントを取得
      const eventsList = await db
        .select()
        .from(events)
        .where(gte(events.eventDate, todayStart))
        .orderBy(desc(events.eventDate));

      // イベントに店舗と演者の情報を結合
      const eventsWithDetails = await Promise.all(
        eventsList.map(async (event) => {
          // 店舗情報を取得
          const storeList = await db
            .select()
            .from(stores)
            .where(eq(stores.id, event.storeId))
            .limit(1);

          // 演者情報を取得
          let actor = null;
          if (event.actorId) {
            const actorList = await db
              .select()
              .from(actors)
              .where(eq(actors.id, event.actorId))
              .limit(1);
            actor = actorList[0] || null;
          }

          return {
            ...event,
            store: storeList[0] || null,
            actor,
          };
        })
      );

      return eventsWithDetails;
    }),
  }),
});

export type AppRouter = typeof appRouter;

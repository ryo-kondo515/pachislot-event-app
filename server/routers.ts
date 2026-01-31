import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { scraperRouter } from "./routers-scraper";
import { actorsRouter } from "./routers-actors";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  stores: router({
    list: publicProcedure.query(async () => {
      const { getDb } = await import("./db");
      const { stores, events, actors } = await import("../drizzle/schema");
      const { eq, and, gte, lte } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return [];
      }

      // 当日の日付を取得（日本時間）
      const now = new Date();
      const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
      const jstDate = new Date(now.getTime() + jstOffset);
      const todayStart = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
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
});

export type AppRouter = typeof appRouter;

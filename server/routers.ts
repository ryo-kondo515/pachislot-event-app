import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { scraperRouter } from "./routers-scraper";

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
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) {
        return [];
      }

      // 店舗一覧を取得
      const storesList = await db.select().from(stores);

      // 各店舗のイベント情報を取得
      const result = await Promise.all(
        storesList.map(async (store) => {
          const storeEvents = await db
            .select()
            .from(events)
            .where(eq(events.storeId, store.id));

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
});

export type AppRouter = typeof appRouter;

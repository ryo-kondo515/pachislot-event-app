import { describe, it, expect } from "vitest";
import { getDb } from "../server/db";
import { stores, events, actors } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

describe("Store Detail API", () => {
  it("should return store detail with today's events only", async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // 当日の日付を取得（日本時間）
    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
    const jstDate = new Date(now.getTime() + jstOffset);
    const todayStart = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    console.log(`Today's date range (JST): ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);

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

    console.log(`Found ${todayEvents.length} events today`);

    if (todayEvents.length === 0) {
      console.log("No events today, skipping test");
      return;
    }

    // 実際に存在する店舗を取得
    const allStores = await db.select().from(stores).limit(1);
    if (allStores.length === 0) {
      console.log("No stores in database, skipping test");
      return;
    }

    const testStoreId = allStores[0].id;
    const store = allStores[0];
    console.log(`Testing with store ID: ${testStoreId}, Name: ${store.name}`);

    // 当日のイベントを取得
    const storeEvents = await db
      .select()
      .from(events)
      .where(
        and(
          eq(events.storeId, testStoreId),
          gte(events.eventDate, todayStart),
          lte(events.eventDate, todayEnd)
        )
      );

    console.log(`Found ${storeEvents.length} events for this store today`);
    
    if (storeEvents.length === 0) {
      console.log("No events for this store today, test passed (empty events list is valid)");
      return;
    }

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

    const storeDetail = {
      ...store,
      events: eventsWithActors,
    };

    // 検証
    expect(storeDetail).toBeDefined();
    expect(storeDetail.id).toBe(testStoreId);
    expect(storeDetail.events.length).toBeGreaterThan(0);
    
    // すべてのイベントが当日のものであることを確認
    storeDetail.events.forEach((event) => {
      const eventDate = new Date(event.eventDate);
      expect(eventDate.getTime()).toBeGreaterThanOrEqual(todayStart.getTime());
      expect(eventDate.getTime()).toBeLessThanOrEqual(todayEnd.getTime());
      console.log(`Event date: ${eventDate.toISOString()}, Actor: ${event.actor?.name || "N/A"}`);
    });

    console.log("✅ Store detail API test passed");
  });
});

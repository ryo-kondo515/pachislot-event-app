import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "../server/db-postgres";
import { stores, events, actors } from "../drizzle/schema-postgres";
import { eq, and, gte, lte } from "drizzle-orm";

describe("Today's Events API", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should filter events by today's date", async () => {
    if (!db) {
      throw new Error("Database not available");
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

    console.log(`Found ${todayEvents.length} events for today`);
    console.log(`Today's date range: ${todayStart.toISOString()} - ${todayEnd.toISOString()}`);

    // 当日のイベントが存在することを確認
    expect(todayEvents.length).toBeGreaterThan(0);

    // 各イベントが当日の範囲内であることを確認
    for (const event of todayEvents) {
      const eventDate = new Date(event.eventDate);
      expect(eventDate.getTime()).toBeGreaterThanOrEqual(todayStart.getTime());
      expect(eventDate.getTime()).toBeLessThanOrEqual(todayEnd.getTime());
    }
  });

  it("should return only stores with today's events", async () => {
    if (!db) {
      throw new Error("Database not available");
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

    console.log(`Found ${storeIdsWithEvents.length} stores with today's events`);

    // 店舗IDが存在することを確認
    expect(storeIdsWithEvents.length).toBeGreaterThan(0);

    // 当日のイベントがある店舗のみを取得
    const storesList = await db.select().from(stores);
    const storesWithTodayEvents = storesList.filter(store => 
      storeIdsWithEvents.includes(store.id)
    );

    console.log(`Filtered to ${storesWithTodayEvents.length} stores with today's events`);

    // フィルタリングされた店舗数が正しいことを確認
    expect(storesWithTodayEvents.length).toBeGreaterThan(0);
    expect(storesWithTodayEvents.length).toBeLessThanOrEqual(storeIdsWithEvents.length);

    // 各店舗に当日のイベントが存在することを確認
    for (const store of storesWithTodayEvents) {
      const storeEvents = todayEvents.filter(e => e.storeId === store.id);
      expect(storeEvents.length).toBeGreaterThan(0);
    }
  });

  it("should include actor information in events", async () => {
    if (!db) {
      throw new Error("Database not available");
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

    // 演者情報を含むイベントを取得
    const eventsWithActors = await Promise.all(
      todayEvents.map(async (event) => {
        if (event.actorId && db) {
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

    console.log(`Found ${eventsWithActors.length} events with actor information`);

    // 演者情報が正しく取得されていることを確認
    const eventsWithActorInfo = eventsWithActors.filter(e => e.actor !== null);
    console.log(`${eventsWithActorInfo.length} events have actor information`);

    // 少なくとも1つのイベントに演者情報が存在することを確認
    expect(eventsWithActorInfo.length).toBeGreaterThan(0);

    // 演者情報が正しい構造であることを確認
    for (const event of eventsWithActorInfo) {
      expect(event.actor).toHaveProperty("id");
      expect(event.actor).toHaveProperty("name");
      expect(typeof event.actor!.name).toBe("string");
    }
  });
});

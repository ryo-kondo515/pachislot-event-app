import axios from "axios";
import * as cheerio from "cheerio";
import { getDb } from "./db-postgres";
import { stores, events, actors, InsertStore, InsertEvent, InsertActor } from "../drizzle/schema-postgres";
import { eq } from "drizzle-orm";

/**
 * スクレイピング結果の型定義
 */
interface ScrapedStore {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  area: string;
  machineCount: number;
  openingTime?: string;
  closingTime?: string;
  isPremium: number;
  sourceUrl: string;
}

interface ScrapedEvent {
  storeName: string;
  actorName?: string;
  eventDate: Date;
  hotLevel: number;
  machineType?: string;
  description?: string;
  sourceUrl: string;
}

/**
 * 店舗情報をデータベースに保存または更新
 */
async function upsertStore(store: ScrapedStore): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 既存店舗を検索
  const existing = await db
    .select()
    .from(stores)
    .where(eq(stores.name, store.name))
    .limit(1);

  if (existing.length > 0) {
    // 更新
    await db
      .update(stores)
      .set({
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        area: store.area,
        machineCount: store.machineCount,
        openingTime: store.openingTime,
        closingTime: store.closingTime,
        isPremium: store.isPremium,
        sourceUrl: store.sourceUrl,
        updatedAt: new Date(),
      })
      .where(eq(stores.id, existing[0].id));
    return existing[0].id;
  } else {
    // 新規作成
    const result = await db.insert(stores).values(store as InsertStore).returning({ id: stores.id });
    return result[0].id;
  }
}

/**
 * 演者情報をデータベースに保存または取得
 */
async function upsertActor(actorName: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 既存演者を検索
  const existing = await db
    .select()
    .from(actors)
    .where(eq(actors.name, actorName))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  } else {
    // 新規作成
    const result = await db.insert(actors).values({ name: actorName } as InsertActor).returning({ id: actors.id });
    return result[0].id;
  }
}

/**
 * イベント情報をデータベースに保存
 */
async function insertEvent(event: ScrapedEvent, storeId: number, actorId?: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(events).values({
    storeId,
    actorId: actorId || null,
    eventDate: event.eventDate,
    hotLevel: event.hotLevel,
    machineType: event.machineType || null,
    description: event.description || null,
    sourceUrl: event.sourceUrl,
  } as InsertEvent);
}

/**
 * drillermaguro.com のスクレイピング
 * 注: 実際のHTML構造に応じて調整が必要
 */
async function scrapeDrillerMaguro(): Promise<{ stores: ScrapedStore[]; events: ScrapedEvent[] }> {
  try {
    const response = await axios.get("https://drillermaguro.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const scrapedStores: ScrapedStore[] = [];
    const scrapedEvents: ScrapedEvent[] = [];

    // TODO: 実際のHTML構造に基づいてセレクタを調整
    // 以下はサンプル実装
    $(".store-item").each((_, element) => {
      const name = $(element).find(".store-name").text().trim();
      const address = $(element).find(".store-address").text().trim();

      if (name && address) {
        scrapedStores.push({
          name,
          address,
          latitude: "35.6812", // TODO: 実際の緯度経度を取得
          longitude: "139.7671",
          area: "東京",
          machineCount: 500,
          isPremium: 0,
          sourceUrl: "https://drillermaguro.com/",
        });
      }
    });

    console.log(`[Scraper] DrillerMaguro: ${scrapedStores.length} stores, ${scrapedEvents.length} events`);
    return { stores: scrapedStores, events: scrapedEvents };
  } catch (error) {
    console.error("[Scraper] Error scraping DrillerMaguro:", error);
    return { stores: [], events: [] };
  }
}

/**
 * すべてのソースからスクレイピングを実行
 */
export async function scrapeAllSources(): Promise<{
  storesCount: number;
  eventsCount: number;
}> {
  console.log("[Scraper] Starting scraping process...");

  const allStores: ScrapedStore[] = [];
  const allEvents: ScrapedEvent[] = [];

  // DrillerMaguro
  const drillerData = await scrapeDrillerMaguro();
  allStores.push(...drillerData.stores);
  allEvents.push(...drillerData.events);

  // TODO: 他のソースも実装
  // const hallNaviData = await scrapeHallNavi();
  // const offmeData = await scrapeOffme();
  // const tousloData = await scrapeTouslo();

  // データベースに保存
  let storesCount = 0;
  let eventsCount = 0;

  for (const store of allStores) {
    try {
      const storeId = await upsertStore(store);
      storesCount++;

      // この店舗に関連するイベントを保存
      const relatedEvents = allEvents.filter((e) => e.storeName === store.name);
      for (const event of relatedEvents) {
        let actorId: number | undefined;
        if (event.actorName) {
          actorId = await upsertActor(event.actorName);
        }
        await insertEvent(event, storeId, actorId);
        eventsCount++;
      }
    } catch (error) {
      console.error(`[Scraper] Error saving store ${store.name}:`, error);
    }
  }

  console.log(`[Scraper] Completed: ${storesCount} stores, ${eventsCount} events`);
  return { storesCount, eventsCount };
}

/**
 * モックデータをデータベースに投入（開発用）
 */
export async function seedMockData(): Promise<void> {
  console.log("[Scraper] Seeding mock data...");

  const mockStores: ScrapedStore[] = [
    {
      name: "パチンコ新宿エース",
      address: "東京都新宿区歌舞伎町1-1-1",
      latitude: "35.6938",
      longitude: "139.7036",
      area: "新宿",
      machineCount: 800,
      openingTime: "10:00",
      closingTime: "23:00",
      isPremium: 1,
      sourceUrl: "https://drillermaguro.com/",
    },
    {
      name: "スロット渋谷センター",
      address: "東京都渋谷区道玄坂1-2-2",
      latitude: "35.6595",
      longitude: "139.6982",
      area: "渋谷",
      machineCount: 600,
      openingTime: "10:00",
      closingTime: "22:30",
      isPremium: 0,
      sourceUrl: "https://hall-navi.com/",
    },
    {
      name: "パチスロ池袋キング",
      address: "東京都豊島区東池袋3-3-3",
      latitude: "35.7295",
      longitude: "139.7190",
      area: "池袋",
      machineCount: 700,
      openingTime: "09:00",
      closingTime: "23:30",
      isPremium: 1,
      sourceUrl: "https://offme.jp/",
    },
  ];

  const mockEvents: ScrapedEvent[] = [
    {
      storeName: "パチンコ新宿エース",
      actorName: "ヤルヲ",
      eventDate: new Date("2026-02-01"),
      hotLevel: 5,
      machineType: "バジリスク絆2",
      description: "超アツイベント！ヤルヲ来店イベント",
      sourceUrl: "https://drillermaguro.com/",
    },
    {
      storeName: "スロット渋谷センター",
      actorName: "ジロウ",
      eventDate: new Date("2026-02-02"),
      hotLevel: 3,
      machineType: "モンキーターン5",
      description: "ジロウ来店イベント",
      sourceUrl: "https://hall-navi.com/",
    },
  ];

  for (const store of mockStores) {
    try {
      const storeId = await upsertStore(store);
      const relatedEvents = mockEvents.filter((e) => e.storeName === store.name);

      for (const event of relatedEvents) {
        let actorId: number | undefined;
        if (event.actorName) {
          actorId = await upsertActor(event.actorName);
        }
        await insertEvent(event, storeId, actorId);
      }
    } catch (error) {
      console.error(`[Scraper] Error seeding store ${store.name}:`, error);
    }
  }

  console.log("[Scraper] Mock data seeded successfully");
}

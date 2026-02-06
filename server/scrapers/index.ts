import { scrapeDrillerMaguro, getHeatLevel as getHeatLevelDriller, guessStoreAddress as guessStoreAddressDriller, type ScrapedEvent } from "./drillermaguro";
import { scrapeHallNavi, getHeatLevel as getHeatLevelHallNavi, guessStoreAddress as guessStoreAddressHallNavi } from "./hallnavi";
import { scrapeOffme, getHeatLevel as getHeatLevelOffme, guessStoreAddress as guessStoreAddressOffme } from "./offme";
import { scrapeTouslo, getHeatLevel as getHeatLevelTouslo, guessStoreAddress as guessStoreAddressTouslo } from "./touslo";
import { scrapeRaitenEx, getHeatLevel as getHeatLevelRaitenEx, guessStoreAddress as guessStoreAddressRaitenEx } from "./raitenex";
import { stores, events, actors } from "../../drizzle/schema-postgres";
import { eq, and } from "drizzle-orm";
import { geocodeStore } from "../geocoding";
import { findStoreOfficialUrl } from "../utils/store-url-finder";

export interface ScrapingResult {
  success: boolean;
  storesAdded: number;
  eventsAdded: number;
  actorsAdded: number;
  errors: string[];
}

/**
 * 全ソースからスクレイピングを実行してデータベースに保存
 */
export async function runAllScrapers(): Promise<ScrapingResult> {
  const result: ScrapingResult = {
    success: true,
    storesAdded: 0,
    eventsAdded: 0,
    actorsAdded: 0,
    errors: [],
  };

  try {
    // 0. 過去のイベントを削除
    console.log("[Scraper] Cleaning up past events...");
    const { cleanupPastEvents } = await import("./cleanup-past-events");
    await cleanupPastEvents();

    // 1. drillermaguro.comからスクレイピング
    console.log("[Scraper] Starting drillermaguro.com scraping...");
    const drillerEvents = await scrapeDrillerMaguro();

    // 1-2. スクレイピング結果をデータベースに保存
    for (const scrapedEvent of drillerEvents) {
      try {
        await saveScrapedEvent(scrapedEvent, result, getHeatLevelDriller, guessStoreAddressDriller);
      } catch (error) {
        const errorMsg = `Failed to save event: ${scrapedEvent.storeName} - ${error}`;
        console.error(`[Scraper] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // 2. hall-navi.comからスクレイピング
    console.log("[Scraper] Starting hall-navi.com scraping...");
    const hallNaviEvents = await scrapeHallNavi();
    for (const scrapedEvent of hallNaviEvents) {
      try {
        await saveScrapedEvent(scrapedEvent, result, getHeatLevelHallNavi, guessStoreAddressHallNavi);
      } catch (error) {
        const errorMsg = `Failed to save event: ${scrapedEvent.storeName} - ${error}`;
        console.error(`[Scraper] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // 3. offme.jpからスクレイピング
    console.log("[Scraper] Starting offme.jp scraping...");
    const offmeEvents = await scrapeOffme();
    for (const scrapedEvent of offmeEvents) {
      try {
        await saveScrapedEvent(scrapedEvent, result, getHeatLevelOffme, guessStoreAddressOffme);
      } catch (error) {
        const errorMsg = `Failed to save event: ${scrapedEvent.storeName} - ${error}`;
        console.error(`[Scraper] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    // 4. touslo777souko.blog.jpからスクレイピング
    // 注意: tousloはエリア別のまとめページなので、個別店舗情報が取得できないため、現在は無効化
    // console.log("[Scraper] Starting touslo777souko.blog.jp scraping...");
    // const tousloEvents = await scrapeTouslo();
    // for (const scrapedEvent of tousloEvents) {
    //   try {
    //     await saveScrapedEvent(scrapedEvent, result, getHeatLevelTouslo, guessStoreAddressTouslo);
    //   } catch (error) {
    //     const errorMsg = `Failed to save event: ${scrapedEvent.storeName} - ${error}`;
    //     console.error(`[Scraper] ${errorMsg}`);
    //     result.errors.push(errorMsg);
    //   }
    // }

    // 5. raiten-ex.comからスクレイピング
    console.log("[Scraper] Starting raiten-ex.com scraping...");
    const raitenExEvents = await scrapeRaitenEx();
    for (const scrapedEvent of raitenExEvents) {
      try {
        await saveScrapedEvent(scrapedEvent, result, getHeatLevelRaitenEx, guessStoreAddressRaitenEx);
      } catch (error) {
        const errorMsg = `Failed to save event: ${scrapedEvent.storeName} - ${error}`;
        console.error(`[Scraper] ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log(`[Scraper] Completed: ${result.storesAdded} stores, ${result.eventsAdded} events, ${result.actorsAdded} actors`);
    
  } catch (error) {
    console.error("[Scraper] Fatal error:", error);
    result.success = false;
    result.errors.push(`Fatal error: ${error}`);
  }

  return result;
}

/**
 * スクレイピング結果をデータベースに保存
 */
async function saveScrapedEvent(
  scrapedEvent: ScrapedEvent, 
  result: ScrapingResult,
  getHeatLevel: (eventType: string) => number,
  guessStoreAddress: (storeName: string, area: string) => string
): Promise<void> {
  const { getDb } = await import("../db-postgres");
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 1. 店舗を検索または作成
  const existingStores = await db.select().from(stores).where(eq(stores.name, scrapedEvent.storeName)).limit(1);
  let store = existingStores[0];

  if (!store) {
    // 店舗が存在しない場合は新規作成
    // geocodeStoreを使用して正確な緯度経度を取得
    const geocodeResult = await geocodeStore(scrapedEvent.storeName, scrapedEvent.area);
    
    const address = geocodeResult?.address || guessStoreAddress(scrapedEvent.storeName, scrapedEvent.area);
    const latitude = geocodeResult?.latitude || guessCoordinates(scrapedEvent.area).lat.toString();
    const longitude = geocodeResult?.longitude || guessCoordinates(scrapedEvent.area).lng.toString();

    // 店舗公式URLを取得
    const officialUrl = await findStoreOfficialUrl(scrapedEvent.storeName, scrapedEvent.area);

    await db.insert(stores).values({
      name: scrapedEvent.storeName,
      address,
      latitude,
      longitude,
      area: scrapedEvent.area,
      machineCount: 500, // デフォルト値
      openingTime: "10:00",
      closingTime: "23:00",
      isPremium: 0,
      sourceUrl: scrapedEvent.sourceUrl,
      officialUrl,
    });

    // 作成した店舗を再取得
    const newStores = await db.select().from(stores).where(eq(stores.name, scrapedEvent.storeName)).limit(1);
    store = newStores[0];
    result.storesAdded++;
    console.log(`[Scraper] Created store: ${store.name}`);
  }

  // 2. イベント日付をチェック（当日以降のみを保存）
  const eventDate = new Date(scrapedEvent.eventDate);
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JSTはUTC+9
  const jstNow = new Date(now.getTime() + jstOffset);
  const todayStart = new Date(Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate()
  ));

  // 過去のイベントはスキップ
  if (eventDate < todayStart) {
    console.log(`[Scraper] Skipped past event: ${store.name} - ${scrapedEvent.eventType} (${scrapedEvent.eventDate})`);
    return;
  }

  // 3. 演者情報の処理
  let actorId: number | null = null;
  if (scrapedEvent.actorName) {
    // 演者名をクリーンアップ（「ワロス来店実践」→「ワロス」など）
    const cleanedActorName = scrapedEvent.actorName
      .replace(/来店実践?/g, "")
      .replace(/取材/g, "")
      .replace(/イベント/g, "")
      .replace(/\s+/g, "")
      .trim();

    if (cleanedActorName) {
      // 演者を検索または作成
      const existingActors = await db.select().from(actors).where(eq(actors.name, cleanedActorName)).limit(1);
      let actor = existingActors[0];

      if (!actor) {
        // 演者が存在しない場合は新規作成
        await db.insert(actors).values({
          name: cleanedActorName,
          imageUrl: null,
          rankScore: 50, // デフォルトスコア
        });

        // 作成した演者を再取得
        const newActors = await db.select().from(actors).where(eq(actors.name, cleanedActorName)).limit(1);
        actor = newActors[0];
        result.actorsAdded++;
        console.log(`[Scraper] Created actor: ${cleanedActorName}`);
      }

      actorId = actor.id;
    }
  }

  // 4. イベントを検索または作成
  const existingEvents = await db.select().from(events)
    .where(and(
      eq(events.storeId, store.id),
      eq(events.eventDate, eventDate)
    ))
    .limit(1);
  const existingEvent = existingEvents[0];

  if (!existingEvent && store) {
    // イベントが存在しない場合は新規作成
    const heatLevel = getHeatLevel(scrapedEvent.eventType);

    await db.insert(events).values({
      storeId: store.id,
      actorId: actorId,
      eventDate,
      hotLevel: heatLevel,
      machineType: scrapedEvent.eventType,
      description: scrapedEvent.actorName
        ? `${scrapedEvent.actorName} ${scrapedEvent.eventType}取材`
        : `${scrapedEvent.eventType}取材`,
      sourceUrl: scrapedEvent.sourceUrl,
    });

    result.eventsAdded++;
    console.log(`[Scraper] Created event: ${store.name} - ${scrapedEvent.eventType} (${scrapedEvent.eventDate})${actorId ? ` with actor: ${scrapedEvent.actorName}` : ""}`);
  } else if (existingEvent && actorId && !existingEvent.actorId) {
    // 既存のイベントに演者情報を追加
    await db.update(events)
      .set({ actorId: actorId })
      .where(eq(events.id, existingEvent.id));

    console.log(`[Scraper] Updated event with actor: ${store.name} - ${scrapedEvent.actorName}`);
  }
}

/**
 * エリア名から簡易的な緯度経度を推測
 * 実際にはGoogle Maps Geocoding APIを使用すべき
 */
function guessCoordinates(area: string): { lat: number; lng: number } {
  const areaCoords: Record<string, { lat: number; lng: number }> = {
    "東京": { lat: 35.6812, lng: 139.7671 },
    "神奈川": { lat: 35.4437, lng: 139.6380 },
    "埼玉": { lat: 35.8617, lng: 139.6455 },
    "千葉": { lat: 35.6074, lng: 140.1065 },
    "宮城": { lat: 38.2682, lng: 140.8694 },
    "北海道": { lat: 43.0642, lng: 141.3469 },
  };

  return areaCoords[area] || { lat: 35.6812, lng: 139.7671 }; // デフォルトは東京
}

/**
 * 定期的にスクレイピングを実行（1日1回）
 */
export function startScheduledScraping() {
  // 初回実行
  runAllScrapers().catch(console.error);

  // 24時間ごとに実行
  setInterval(() => {
    console.log("[Scraper] Starting scheduled scraping...");
    runAllScrapers().catch(console.error);
  }, 24 * 60 * 60 * 1000); // 24時間
}

import { getDb } from "../server/db";
import { stores, events, actors } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

async function checkAPIResponse() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  // 当日の日付を取得（日本時間）
  const now = new Date();
  console.log(`Current time (UTC): ${now.toISOString()}`);
  
  const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
  const jstDate = new Date(now.getTime() + jstOffset);
  console.log(`Current time (JST): ${jstDate.toISOString()}`);
  
  // UTC基準で日付範囲を計算
  const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  console.log(`\nToday's date range (for filtering):`);
  console.log(`  Start: ${todayStart.toISOString()}`);
  console.log(`  End: ${todayEnd.toISOString()}`);

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

  console.log(`\nFound ${todayEvents.length} events today`);
  
  if (todayEvents.length > 0) {
    console.log("\nToday's events:");
    todayEvents.slice(0, 10).forEach((event) => {
      console.log(`  ID: ${event.id}, StoreID: ${event.storeId}, Date: ${new Date(event.eventDate).toISOString()}`);
    });
  }

  // 当日のイベントがある店舗IDを取得
  const storeIdsWithEvents = [...new Set(todayEvents.map(e => e.storeId))];
  console.log(`\nStore IDs with today's events: ${storeIdsWithEvents.join(', ')}`);

  // stores.list APIと同じロジックで店舗を取得
  const storesList = await db.select().from(stores);
  const storesWithTodayEvents = storesList.filter(store => 
    storeIdsWithEvents.includes(store.id)
  );

  console.log(`\nStores with today's events: ${storesWithTodayEvents.length}`);
  storesWithTodayEvents.slice(0, 5).forEach((store) => {
    console.log(`  ID: ${store.id}, Name: ${store.name}`);
  });

  process.exit(0);
}

checkAPIResponse();

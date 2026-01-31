import { getDb } from "../server/db";
import { stores, events } from "../drizzle/schema";

async function addTodayTestEvents() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  // 当日の日付を取得（日本時間）
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
  const jstDate = new Date(now.getTime() + jstOffset);
  const todayStart = new Date(Date.UTC(jstDate.getUTCFullYear(), jstDate.getUTCMonth(), jstDate.getUTCDate()) - jstOffset);
  
  console.log(`Adding test events for today: ${todayStart.toISOString()}`);

  // すべての店舗を取得
  const allStores = await db.select().from(stores);
  console.log(`Found ${allStores.length} stores in database`);

  if (allStores.length === 0) {
    console.error("No stores found in database");
    return;
  }

  // 各店舗に当日のイベントを追加
  let addedCount = 0;
  for (const store of allStores) {
    await db.insert(events).values({
      storeId: store.id,
      actorId: null,
      eventDate: todayStart,
      hotLevel: Math.floor(Math.random() * 3) + 1, // 1-3のランダムなアツさレベル
      machineType: ["ジャンドリ", "マグロ", "極上"][Math.floor(Math.random() * 3)],
      description: "テストイベント",
      sourceUrl: "https://example.com",
    });
    addedCount++;
    console.log(`✓ Added event for ${store.name}`);
  }

  console.log(`\n✅ Added ${addedCount} test events for today`);
  process.exit(0);
}

addTodayTestEvents();

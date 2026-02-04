import { getDb } from "../server/db-postgres";
import { stores, events, actors } from "../drizzle/schema-postgres";

async function addTodayEvents() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // 当日の日付を取得（日本時間）
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JST = UTC+9
  const jstDate = new Date(now.getTime() + jstOffset);
  const today = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate(), 12, 0, 0);

  console.log(`[Test] Adding events for today: ${today.toISOString()}`);

  // 既存の店舗を取得
  const storesList = await db.select().from(stores).limit(10);
  console.log(`[Test] Found ${storesList.length} stores`);

  if (storesList.length === 0) {
    console.error("[Test] No stores found in database");
    return;
  }

  // 既存の演者を取得
  const actorsList = await db.select().from(actors).limit(5);
  console.log(`[Test] Found ${actorsList.length} actors`);

  // 各店舗に当日のイベントを追加
  let eventsAdded = 0;
  for (let i = 0; i < Math.min(storesList.length, 5); i++) {
    const store = storesList[i];
    const actor = actorsList[i % actorsList.length];
    const hotLevel = Math.floor(Math.random() * 3) + 3; // 3-5のランダムなアツさレベル

    try {
      await db.insert(events).values({
        storeId: store.id,
        actorId: actor?.id || null,
        eventDate: today,
        hotLevel,
        machineType: "バジリスク絆2",
        description: `${actor?.name || "スタッフ"}来店イベント`,
        sourceUrl: store.sourceUrl || "https://drillermaguro.com/",
      });
      eventsAdded++;
      console.log(`[Test] Added event for ${store.name} (hotLevel: ${hotLevel})`);
    } catch (error) {
      console.error(`[Test] Error adding event for ${store.name}:`, error);
    }
  }

  console.log(`[Test] Successfully added ${eventsAdded} events for today`);
}

addTodayEvents().catch(console.error);

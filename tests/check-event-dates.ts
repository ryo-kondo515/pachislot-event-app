import { getDb } from "../server/db";
import { events } from "../drizzle/schema";

async function checkEventDates() {
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
  
  const todayStart = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  
  console.log(`Today's date range (JST):`);
  console.log(`  Start: ${todayStart.toISOString()}`);
  console.log(`  End: ${todayEnd.toISOString()}`);

  // すべてのイベントを取得
  const allEvents = await db.select().from(events).limit(20);
  
  console.log(`\nAll events in database (first 20):`);
  allEvents.forEach((event) => {
    const eventDate = new Date(event.eventDate);
    const isToday = eventDate.getTime() >= todayStart.getTime() && eventDate.getTime() < todayEnd.getTime();
    console.log(`  ID: ${event.id}, StoreID: ${event.storeId}, Date: ${eventDate.toISOString()} (${isToday ? 'TODAY' : 'NOT TODAY'})`);
  });

  process.exit(0);
}

checkEventDates();

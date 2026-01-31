import { getDb } from "../server/db";
import { stores, events } from "../drizzle/schema";

async function checkStores() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  const storesList = await db.select().from(stores).limit(10);
  console.log("Stores in database:");
  storesList.forEach((store) => {
    console.log(`  ID: ${store.id}, Name: ${store.name}`);
  });

  const eventsList = await db.select().from(events).limit(10);
  console.log("\nEvents in database:");
  eventsList.forEach((event) => {
    console.log(`  ID: ${event.id}, StoreID: ${event.storeId}, Date: ${event.eventDate}`);
  });

  process.exit(0);
}

checkStores();

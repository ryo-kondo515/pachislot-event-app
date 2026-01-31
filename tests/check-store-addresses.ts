import { getDb } from "../server/db";
import { stores } from "../drizzle/schema";

async function checkStoreAddresses() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  const allStores = await db.select().from(stores);
  console.log(`Found ${allStores.length} stores in database\n`);

  console.log("Store addresses:");
  allStores.forEach((store) => {
    console.log(`\nID: ${store.id}`);
    console.log(`  Name: ${store.name}`);
    console.log(`  Address: ${store.address}`);
    console.log(`  Latitude: ${store.latitude}`);
    console.log(`  Longitude: ${store.longitude}`);
    console.log(`  Area: ${store.area}`);
  });

  process.exit(0);
}

checkStoreAddresses();

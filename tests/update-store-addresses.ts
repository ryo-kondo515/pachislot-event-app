import { getDb } from "../server/db";
import { stores } from "../drizzle/schema";
import { geocodeStore } from "../server/geocoding";
import { eq } from "drizzle-orm";

async function updateStoreAddresses() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  const allStores = await db.select().from(stores);
  console.log(`Found ${allStores.length} stores in database\n`);

  let updatedCount = 0;
  for (const store of allStores) {
    console.log(`\nProcessing: ${store.name} (${store.area})`);
    console.log(`  Current address: ${store.address}`);
    
    try {
      const result = await geocodeStore(store.name, store.area);
      
      if (result) {
        await db.update(stores)
          .set({
            address: result.address,
            latitude: result.latitude,
            longitude: result.longitude,
          })
          .where(eq(stores.id, store.id));
        
        console.log(`  ✓ Updated address: ${result.address}`);
        console.log(`  ✓ Updated coordinates: ${result.latitude}, ${result.longitude}`);
        updatedCount++;
      } else {
        console.log(`  ✗ Failed to geocode`);
      }
      
      // LLM APIのレート制限を避けるために待機
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error: ${error}`);
    }
  }

  console.log(`\n✅ Updated ${updatedCount} out of ${allStores.length} stores`);
  process.exit(0);
}

updateStoreAddresses();

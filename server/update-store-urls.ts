import { getDb } from "./db";
import { stores } from "../drizzle/schema";
import { isNull } from "drizzle-orm";
import { findStoreOfficialUrl } from "./utils/store-url-finder";

/**
 * 既存店舗の公式URLを一括更新するスクリプト
 */
async function updateStoreUrls() {
  console.log("[UpdateStoreUrls] Starting batch update of store official URLs...");
  
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // officialUrlがnullの店舗を取得
  const storesWithoutUrl = await db
    .select()
    .from(stores)
    .where(isNull(stores.officialUrl));

  console.log(`[UpdateStoreUrls] Found ${storesWithoutUrl.length} stores without official URL`);

  let successCount = 0;
  let failCount = 0;

  for (const store of storesWithoutUrl) {
    console.log(`[UpdateStoreUrls] Processing: ${store.name} (${store.area})`);
    
    try {
      const officialUrl = await findStoreOfficialUrl(store.name, store.area);
      
      if (officialUrl) {
        await db
          .update(stores)
          .set({ officialUrl })
          .where({ id: store.id } as any);
        
        successCount++;
        console.log(`[UpdateStoreUrls] ✓ Updated: ${store.name} -> ${officialUrl}`);
      } else {
        failCount++;
        console.log(`[UpdateStoreUrls] ✗ No URL found: ${store.name}`);
      }
      
      // レート制限を避けるために少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      failCount++;
      console.error(`[UpdateStoreUrls] Error processing ${store.name}:`, error);
    }
  }

  console.log("\n=== Update Complete ===");
  console.log(`Total stores: ${storesWithoutUrl.length}`);
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

updateStoreUrls().catch(console.error);

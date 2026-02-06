import "dotenv/config";
import { getDb } from "./db-postgres";
import { stores } from "../drizzle/schema-postgres";
import { geocodeStore } from "./geocoding";
import { eq } from "drizzle-orm";

/**
 * 既存の全店舗の座標をGoogle Maps Places APIで更新する
 */
async function updateAllStoreGeocoding() {
  console.log("[UpdateGeocoding] Starting...");

  const db = await getDb();
  if (!db) {
    console.error("[UpdateGeocoding] Database not available");
    return;
  }

  // 全店舗を取得
  const allStores = await db.select().from(stores);
  console.log(`[UpdateGeocoding] Found ${allStores.length} stores`);

  let updated = 0;
  let failed = 0;

  for (const store of allStores) {
    try {
      console.log(`[UpdateGeocoding] Processing: ${store.name} (${store.area})`);

      // Google Maps Places APIでジオコーディング
      const result = await geocodeStore(store.name, store.area);

      if (result) {
        // データベースを更新
        await db
          .update(stores)
          .set({
            latitude: result.latitude,
            longitude: result.longitude,
            address: result.address,
          })
          .where(eq(stores.id, store.id));

        console.log(`[UpdateGeocoding] ✓ Updated: ${store.name} -> ${result.address}`);
        updated++;
      } else {
        console.warn(`[UpdateGeocoding] ✗ Failed: ${store.name}`);
        failed++;
      }

      // レート制限対策（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[UpdateGeocoding] Error processing ${store.name}:`, error);
      failed++;
    }
  }

  console.log(`[UpdateGeocoding] Completed: ${updated} updated, ${failed} failed`);
}

// 実行
updateAllStoreGeocoding()
  .then(() => {
    console.log("[UpdateGeocoding] Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[UpdateGeocoding] Fatal error:", error);
    process.exit(1);
  });

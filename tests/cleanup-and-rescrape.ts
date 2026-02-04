import { getDb } from "../server/db-postgres";
import { stores, events, actors } from "../drizzle/schema-postgres";
import { runAllScrapers } from "../server/scrapers";

async function cleanupAndRescrape() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  console.log("=== Cleaning up database ===");
  
  // すべてのイベントを削除
  await db.delete(events);
  console.log("✓ Deleted all events");

  // すべての店舗を削除
  await db.delete(stores);
  console.log("✓ Deleted all stores");

  // すべての演者を削除
  await db.delete(actors);
  console.log("✓ Deleted all actors");

  console.log("\n=== Starting scraping ===");
  
  // スクレイピングを実行
  const result = await runAllScrapers();
  
  console.log("\n=== Scraping completed ===");
  console.log(`Success: ${result.success}`);
  console.log(`Stores added: ${result.storesAdded}`);
  console.log(`Events added: ${result.eventsAdded}`);
  console.log(`Actors added: ${result.actorsAdded}`);
  
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach(error => console.log(`  - ${error}`));
  }

  process.exit(0);
}

cleanupAndRescrape();

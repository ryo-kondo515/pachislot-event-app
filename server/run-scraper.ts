import { runAllScrapers } from "./scrapers";

async function main() {
  console.log("Starting all scrapers...");
  const result = await runAllScrapers();
  
  console.log("\n=== Scraping Results ===");
  console.log(`Success: ${result.success}`);
  console.log(`Stores added: ${result.storesAdded}`);
  console.log(`Events added: ${result.eventsAdded}`);
  console.log(`Actors added: ${result.actorsAdded}`);
  
  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
}

main().catch(console.error);

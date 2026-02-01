import { runAllScrapers } from "../server/scrapers/index";

async function testRaitenExScraping() {
  console.log("=== Testing raiten-ex.com scraping ===\n");

  try {
    const result = await runAllScrapers();

    console.log("\n=== Scraping Results ===");
    console.log(`Success: ${result.success}`);
    console.log(`Stores added: ${result.storesAdded}`);
    console.log(`Events added: ${result.eventsAdded}`);
    console.log(`Actors added: ${result.actorsAdded}`);
    
    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testRaitenExScraping();

import { runAllScrapers } from "../server/scrapers/index";

async function testScrapingWithCleanup() {
  console.log("=== Testing scraping with past event cleanup ===\n");

  try {
    const result = await runAllScrapers();
    
    console.log("\n=== Scraping Result ===");
    console.log(`Success: ${result.success}`);
    console.log(`Stores added: ${result.storesAdded}`);
    console.log(`Events added: ${result.eventsAdded}`);
    console.log(`Actors added: ${result.actorsAdded}`);
    console.log(`Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log("\nErrors:");
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

testScrapingWithCleanup();

import { scrapeDrillerMaguro } from "../server/scrapers/drillermaguro";
import { scrapeHallNavi } from "../server/scrapers/hallnavi";

async function testPuppeteerScraping() {
  console.log("=".repeat(60));
  console.log("Testing Puppeteer-based scraping");
  console.log("=".repeat(60));

  // Test DrillerMaguro
  console.log("\n[Test] Testing drillermaguro.com scraper...");
  try {
    const drillerEvents = await scrapeDrillerMaguro();
    console.log(`[Test] DrillerMaguro: Successfully scraped ${drillerEvents.length} events`);
    
    if (drillerEvents.length > 0) {
      console.log("[Test] Sample event:");
      console.log(JSON.stringify(drillerEvents[0], null, 2));
    }
  } catch (error) {
    console.error("[Test] DrillerMaguro failed:", error);
  }

  // Wait before next scraper
  console.log("\n[Test] Waiting 5 seconds before next scraper...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Test HallNavi
  console.log("\n[Test] Testing hall-navi.com scraper...");
  try {
    const hallNaviEvents = await scrapeHallNavi();
    console.log(`[Test] HallNavi: Successfully scraped ${hallNaviEvents.length} events`);
    
    if (hallNaviEvents.length > 0) {
      console.log("[Test] Sample event:");
      console.log(JSON.stringify(hallNaviEvents[0], null, 2));
    }
  } catch (error) {
    console.error("[Test] HallNavi failed:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test completed");
  console.log("=".repeat(60));
}

testPuppeteerScraping()
  .then(() => {
    console.log("\n[Test] All tests completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Test] Test failed:", error);
    process.exit(1);
  });

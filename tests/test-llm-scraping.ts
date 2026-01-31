import { scrapeHallNaviWithLLM } from "../server/scrapers/hallnavi-llm";
import { scrapeDrillerMaguro } from "../server/scrapers/drillermaguro";

async function testLLMScraping() {
  console.log("=".repeat(60));
  console.log("Testing LLM-based scraping");
  console.log("=".repeat(60));

  // Test HallNavi with LLM
  console.log("\n[Test] Testing hall-navi.com scraper with LLM...");
  try {
    const hallNaviEvents = await scrapeHallNaviWithLLM();
    console.log(`[Test] HallNavi (LLM): Successfully scraped ${hallNaviEvents.length} events`);
    
    if (hallNaviEvents.length > 0) {
      console.log("[Test] Sample events:");
      hallNaviEvents.slice(0, 3).forEach((event, index) => {
        console.log(`${index + 1}. ${JSON.stringify(event, null, 2)}`);
      });
    } else {
      console.log("[Test] No events found (may still be blocked by Cloudflare)");
    }
  } catch (error) {
    console.error("[Test] HallNavi (LLM) failed:", error);
  }

  // Wait before next scraper
  console.log("\n[Test] Waiting 5 seconds before next scraper...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Test DrillerMaguro for comparison
  console.log("\n[Test] Testing drillermaguro.com scraper (for comparison)...");
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

  console.log("\n" + "=".repeat(60));
  console.log("Test completed");
  console.log("=".repeat(60));
}

testLLMScraping()
  .then(() => {
    console.log("\n[Test] All tests completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Test] Test failed:", error);
    process.exit(1);
  });

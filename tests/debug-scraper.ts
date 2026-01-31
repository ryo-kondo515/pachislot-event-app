import { scrapeDrillerMaguro } from "../server/scrapers/drillermaguro";

async function debugScraper() {
  console.log("=== Starting scraper debug ===");
  
  try {
    const events = await scrapeDrillerMaguro();
    console.log(`\n✅ Scraped ${events.length} events\n`);
    
    if (events.length > 0) {
      console.log("First 5 events:");
      events.slice(0, 5).forEach((event, index) => {
        console.log(`\n[${index + 1}]`);
        console.log(`  Store: ${event.storeName}`);
        console.log(`  Area: ${event.area}`);
        console.log(`  Date: ${event.eventDate}`);
        console.log(`  Type: ${event.eventType}`);
        console.log(`  URL: ${event.sourceUrl}`);
      });
    } else {
      console.log("⚠️  No events scraped. Checking HTML structure...");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugScraper();

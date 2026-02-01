import { scrapeRaitenEx } from "./scrapers/raitenex";

async function test() {
  console.log("Testing raiten-ex.com scraper...");
  const events = await scrapeRaitenEx();
  console.log(`\nScraped ${events.length} events:`);
  
  // 最初の5件を表示
  events.slice(0, 5).forEach((event, index) => {
    console.log(`\n${index + 1}. ${event.storeName}`);
    console.log(`   エリア: ${event.area}`);
    console.log(`   日付: ${event.eventDate}`);
    console.log(`   イベントタイプ: ${event.eventType}`);
    console.log(`   演者: ${event.actorName}`);
  });
}

test().catch(console.error);

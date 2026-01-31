import { fetchPageWithPuppeteer } from "../server/scrapers/puppeteer-utils";
import { parseEventsWithLLM } from "../server/scrapers/llm-parser";
import { scrapeDrillerMaguro } from "../server/scrapers/drillermaguro";

async function testLLMParserWithDriller() {
  console.log("=".repeat(60));
  console.log("Testing LLM Parser with DrillerMaguro HTML");
  console.log("=".repeat(60));

  const url = "https://drillermaguro.com/";

  // 1. 従来のCheerioベースのスクレイパー
  console.log("\n[Test] 1. Traditional Cheerio-based scraper:");
  try {
    const cheerioEvents = await scrapeDrillerMaguro();
    console.log(`   Found ${cheerioEvents.length} events`);
    if (cheerioEvents.length > 0) {
      console.log("   Sample:", JSON.stringify(cheerioEvents[0], null, 2));
    }
  } catch (error) {
    console.error("   Error:", error);
  }

  // 2. LLMベースのパーサー
  console.log("\n[Test] 2. LLM-based parser:");
  try {
    console.log("   Fetching HTML with Puppeteer...");
    const html = await fetchPageWithPuppeteer(url, {
      waitForSelector: "a[href*='/interview/']",
      timeout: 30000,
      retries: 2,
    });

    if (!html) {
      console.error("   Failed to fetch HTML");
      return;
    }

    console.log(`   HTML fetched (${html.length} bytes)`);
    console.log("   Parsing with LLM...");

    const llmEvents = await parseEventsWithLLM(html, url);
    console.log(`   Found ${llmEvents.length} events`);
    
    if (llmEvents.length > 0) {
      console.log("   Sample events:");
      llmEvents.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(event, null, 2)}`);
      });
    }
  } catch (error) {
    console.error("   Error:", error);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Test completed");
  console.log("=".repeat(60));
}

testLLMParserWithDriller()
  .then(() => {
    console.log("\n[Test] Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Test] Test failed:", error);
    process.exit(1);
  });

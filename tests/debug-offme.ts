import axios from "axios";
import * as cheerio from "cheerio";

async function debugOffme() {
  console.log("[Debug] Fetching offme.jp...");
  
  const response = await axios.get("https://offme.jp/", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);

  console.log("\n=== All Links ===");
  let count = 0;
  $("a").each((_, element) => {
    const $el = $(element);
    const text = $el.text().trim();
    const href = $el.attr("href");
    
    if (href && text && count < 50) {
      console.log(`${count}: ${text} -> ${href}`);
      count++;
    }
  });
}

debugOffme().catch(console.error);

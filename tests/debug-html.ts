import axios from "axios";
import * as cheerio from "cheerio";
import * as fs from "fs";

async function debugHTML() {
  const url = "https://drillermaguro.com/";
  
  try {
    console.log(`Fetching ${url}...`);
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Content length: ${response.data.length} bytes`);

    // HTMLをファイルに保存
    fs.writeFileSync("/home/ubuntu/drillermaguro.html", response.data);
    console.log("✅ HTML saved to /home/ubuntu/drillermaguro.html");

    const $ = cheerio.load(response.data);

    // 各種セレクタをテスト
    console.log("\n=== Testing selectors ===");
    
    const selectors = [
      "a[href*='/interview/']",
      "a[href*='interview']",
      ".post",
      ".entry",
      "article",
      "h2 a",
      "h3 a",
      ".title a",
    ];

    for (const selector of selectors) {
      const count = $(selector).length;
      console.log(`${selector}: ${count} elements`);
      
      if (count > 0 && count < 5) {
        $(selector).each((i, el) => {
          const text = $(el).text().trim().substring(0, 100);
          const href = $(el).attr("href");
          console.log(`  [${i}] ${text}... (href: ${href})`);
        });
      }
    }

    // すべてのリンクを確認
    console.log("\n=== All links (first 20) ===");
    $("a").slice(0, 20).each((i, el) => {
      const text = $(el).text().trim().substring(0, 50);
      const href = $(el).attr("href");
      if (text && href) {
        console.log(`[${i}] ${text}... -> ${href}`);
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugHTML();

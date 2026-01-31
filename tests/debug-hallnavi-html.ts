import { fetchPageWithPuppeteer } from "../server/scrapers/puppeteer-utils";
import { writeFileSync } from "fs";
import { join } from "path";

async function debugHallNaviHtml() {
  console.log("[Debug] Fetching hall-navi.com HTML with Puppeteer...");

  const html = await fetchPageWithPuppeteer("https://hall-navi.com/", {
    timeout: 30000,
    retries: 3,
  });

  if (!html) {
    console.error("[Debug] Failed to fetch HTML");
    return;
  }

  console.log(`[Debug] Successfully fetched HTML (${html.length} bytes)`);

  // HTMLをファイルに保存
  const outputPath = join(__dirname, "hallnavi-debug.html");
  writeFileSync(outputPath, html, "utf-8");
  console.log(`[Debug] HTML saved to: ${outputPath}`);

  // HTMLの最初の1000文字を表示
  console.log("\n[Debug] First 1000 characters of HTML:");
  console.log(html.substring(0, 1000));

  // リンクを検索
  const linkMatches = html.match(/<a[^>]*href="[^"]*"[^>]*>/g);
  console.log(`\n[Debug] Found ${linkMatches?.length || 0} <a> tags`);

  if (linkMatches && linkMatches.length > 0) {
    console.log("\n[Debug] First 10 <a> tags:");
    linkMatches.slice(0, 10).forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
  }

  // /hall/を含むリンクを検索
  const hallLinks = html.match(/<a[^>]*href="[^"]*\/hall\/[^"]*"[^>]*>/g);
  console.log(`\n[Debug] Found ${hallLinks?.length || 0} links containing '/hall/'`);

  if (hallLinks && hallLinks.length > 0) {
    console.log("\n[Debug] Links containing '/hall/':");
    hallLinks.slice(0, 5).forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
  }

  // 日付パターンを検索（例：1/25、1月25日）
  const datePatterns = [
    /\d+\/\d+/g,
    /\d+月\d+日/g,
  ];

  console.log("\n[Debug] Searching for date patterns:");
  datePatterns.forEach((pattern, index) => {
    const matches = html.match(pattern);
    console.log(`Pattern ${index + 1} (${pattern}): ${matches?.length || 0} matches`);
    if (matches && matches.length > 0) {
      console.log(`  Examples: ${matches.slice(0, 5).join(", ")}`);
    }
  });
}

debugHallNaviHtml()
  .then(() => {
    console.log("\n[Debug] Analysis completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n[Debug] Error:", error);
    process.exit(1);
  });

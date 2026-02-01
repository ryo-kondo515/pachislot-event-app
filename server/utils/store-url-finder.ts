import { invokeLLM } from "../_core/llm";
import puppeteer from "puppeteer";

/**
 * ブラウザで店舗名を検索して公式URLを取得する
 */
async function findUrlWithBrowser(storeName: string, area: string): Promise<string | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Google検索で店舗名 + 公式サイトを検索
    const searchQuery = `${storeName} ${area} 公式サイト`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
    
    console.log(`[BrowserSearch] Searching: ${searchQuery}`);
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    
    // 検索結果から最初のリンクを取得
    const firstLink = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('http') && 
            !href.includes('google.com') && 
            !href.includes('youtube.com') &&
            !href.includes('facebook.com') &&
            !href.includes('twitter.com') &&
            !href.includes('instagram.com') &&
            !href.includes('p-world.co.jp') &&
            !href.includes('raiten-ex.com') &&
            !href.includes('touslo.jp')) {
          return href;
        }
      }
      return null;
    });
    
    await browser.close();
    
    if (firstLink) {
      console.log(`[BrowserSearch] Found URL for ${storeName}: ${firstLink}`);
      return firstLink;
    } else {
      console.log(`[BrowserSearch] No URL found for: ${storeName}`);
      return null;
    }
  } catch (error) {
    console.error(`[BrowserSearch] Error searching for ${storeName}:`, error);
    if (browser) {
      await browser.close();
    }
    return null;
  }
}

/**
 * 店舗名とエリアから公式ホームページのURLを検索する
 * LLMを使用して店舗の公式URLを推測する
 */
export async function findStoreOfficialUrl(storeName: string, area: string): Promise<string | null> {
  try {
    const prompt = `以下の店舗の公式ホームページのURLを教えてください。

店舗名: ${storeName}
エリア: ${area}

回答は以下の形式で返してください：
- URLが見つかった場合: URLのみを返す（例: https://example.com）
- URLが見つからなかった場合: "NOT_FOUND"と返す

注意事項:
- 必ず実在する公式ホームページのURLを返してください
- スクレイピングサイトや情報サイトのURLではなく、店舗自身が運営する公式サイトのURLを返してください
- 不確実な場合は"NOT_FOUND"と返してください`;

    const result = await invokeLLM({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseContent = typeof result.choices[0]?.message?.content === "string" 
      ? result.choices[0].message.content 
      : "";

    const urlResult = responseContent.trim();
    
    // URLが見つからなかった場合、ブラウザ検索を試みる
    if (urlResult === "NOT_FOUND" || !urlResult.startsWith("http")) {
      console.log(`[StoreUrlFinder] LLM search failed for: ${storeName}, trying browser search...`);
      return await findUrlWithBrowser(storeName, area);
    }

    console.log(`[StoreUrlFinder] Found official URL for ${storeName}: ${urlResult}`);
    return urlResult;
  } catch (error) {
    console.error(`[StoreUrlFinder] Error finding URL for ${storeName}:`, error);
    return null;
  }
}

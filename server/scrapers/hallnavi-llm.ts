import { fetchPageWithPuppeteer, delay } from "./puppeteer-utils";
import { parseEventsWithLLM, isCloudflareChallengePage } from "./llm-parser";
import type { ScrapedEvent } from "./drillermaguro";

/**
 * LLMを使用してhall-navi.comから取材情報をスクレイピング
 * Cloudflareチャレンジを待機してから、LLMでHTMLを解析する
 */
export async function scrapeHallNaviWithLLM(): Promise<ScrapedEvent[]> {
  const url = "https://hall-navi.com/";
  console.log("[HallNavi-LLM] Starting scraping with Puppeteer + LLM...");

  try {
    // Puppeteerでページを取得（Cloudflareチャレンジを待機）
    const html = await fetchPageWithPuppeteer(url, {
      timeout: 45000, // タイムアウトを延長
      retries: 2,
    });

    if (!html) {
      console.error("[HallNavi-LLM] Failed to fetch HTML");
      return [];
    }

    // Cloudflareチャレンジページかどうかをチェック
    const isChallengePage = await isCloudflareChallengePage(html);
    if (isChallengePage) {
      console.warn("[HallNavi-LLM] Cloudflare challenge page detected, attempting to wait longer...");
      
      // さらに待機してから再試行
      await delay(10000);
      
      const retryHtml = await fetchPageWithPuppeteer(url, {
        timeout: 60000,
        retries: 1,
      });
      
      if (!retryHtml || await isCloudflareChallengePage(retryHtml)) {
        console.error("[HallNavi-LLM] Still getting Cloudflare challenge page after retry");
        return [];
      }
      
      // LLMでHTMLを解析
      return await parseEventsWithLLM(retryHtml, url);
    }

    // LLMでHTMLを解析
    const events = await parseEventsWithLLM(html, url);
    
    console.log(`[HallNavi-LLM] Successfully scraped ${events.length} events`);
    return events;
  } catch (error) {
    console.error("[HallNavi-LLM] Error scraping hall-navi.com:", error);
    return [];
  }
}

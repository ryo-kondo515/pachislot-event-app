import * as cheerio from "cheerio";
import { fetchPageWithPuppeteer } from "./puppeteer-utils";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD
  eventType: string;
  actorName?: string; // 演者名（オプショナル）
  sourceUrl: string;
  scrapedAt: Date;
}

/**
 * hall-navi.comから取材情報をスクレイピング
 */
export async function scrapeHallNavi(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    console.log("[HallNavi] Starting scraping with Puppeteer...");
    
    const html = await fetchPageWithPuppeteer("https://hall-navi.com/", {
      timeout: 30000,
      retries: 3,
    });

    if (!html) {
      console.error("[HallNavi] Failed to fetch HTML");
      return [];
    }

    const $ = cheerio.load(html);
    const currentYear = new Date().getFullYear();

    // 結果レポートのリンクを取得
    // hall-navi.comは結果レポートが個別ページになっているため、
    // トップページから店舗情報を抽出する
    
    // 店舗カードから情報を抽出
    $("a").each((_, element) => {
      const $el = $(element);
      const href = $el.attr("href");
      
      if (!href || !href.includes("/hall/")) return;
      
      // 店舗ページのリンクから情報を抽出
      const text = $el.text().trim();
      
      // 日付情報を探す（例：1/25(日)）
      const dateMatch = text.match(/(\d+)\/(\d+)\(.*?\)/);
      if (!dateMatch) return;
      
      // エリア情報を探す
      const areaMatch = text.match(/(東京都|神奈川県|埼玉県|千葉県|茨城県|栃木県|群馬県)/);
      if (!areaMatch) return;
      
      // 店舗名を抽出（エリアの後の部分）
      const storeNameMatch = text.match(/[都県]\s*(.+?)$/);
      if (!storeNameMatch) return;
      
      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      const eventDate = parseDateString(`${month}月${day}日`, currentYear);
      
      const fullUrl = href.startsWith("http") ? href : `https://hall-navi.com${href}`;
      
      events.push({
        storeName: storeNameMatch[1].trim(),
        area: areaMatch[1].replace(/[都県]$/, ""),
        eventDate,
        eventType: "取材",
        sourceUrl: fullUrl,
        scrapedAt: new Date(),
      });
    });

    // 重複を除去
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex((e) => 
        e.storeName === event.storeName && 
        e.eventDate === event.eventDate
      )
    );

    console.log(`[HallNavi] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[HallNavi] Error:", error);
    return [];
  }
}

/**
 * 日付文字列をYYYY-MM-DD形式に変換
 */
function parseDateString(dateStr: string, year: number): string {
  const match = dateStr.match(/(\d+)月(\d+)日/);
  if (!match) return new Date().toISOString().split("T")[0];

  const month = parseInt(match[1]);
  const day = parseInt(match[2]);

  // 月が現在より小さい場合は来年の日付
  const currentMonth = new Date().getMonth() + 1;
  const targetYear = month < currentMonth ? year + 1 : year;

  return `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * イベントタイプからアツさレベルを判定
 */
export function getHeatLevel(eventType: string): number {
  // hall-navi.comは取材の種類が多様なため、一律レベル3とする
  return 3;
}

/**
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

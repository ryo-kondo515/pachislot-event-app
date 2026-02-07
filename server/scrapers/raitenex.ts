import * as cheerio from "cheerio";
import { fetchPageWithPuppeteer } from "./puppeteer-utils";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD形式
  eventType: string;
  sourceUrl: string;
  scrapedAt: Date;
  actorName?: string; // raiten-ex.comのみ
  rating?: number; // raiten-ex.comの総合評価（アツい度）
}

/**
 * raiten-ex.comからイベント情報をスクレイピング
 */
export async function scrapeRaitenEx(): Promise<ScrapedEvent[]> {
  const url = "https://raiten-ex.com/";
  console.log("[RaitenEx] Starting scraping with Puppeteer...");

  try {
    const html = await fetchPageWithPuppeteer(url, { waitForSelector: "table", timeout: 30000 });
    if (!html) {
      console.error("[RaitenEx] Failed to fetch HTML");
      return [];
    }
    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    // テーブルの各行を解析
    $("table tbody tr").each((_, row) => {
      const $row = $(row);
      const cells = $row.find("td");

      if (cells.length < 7) return; // データが不完全な行はスキップ

      const dateText = $(cells[0]).text().trim(); // "2/1(日)"
      const prefecture = $(cells[1]).text().trim(); // "東京都"
      const storeName = $(cells[2]).find("a").text().trim(); // "123+N東雲店"
      const actorName = $(cells[3]).find("a").text().trim(); // "ワロス来店実践"
      const rating = $(cells[4]).text().trim(); // "4.5"

      // データが不完全な場合はスキップ
      if (!dateText || !prefecture || !storeName || !actorName || dateText === "---" || prefecture === "---") {
        return;
      }

      // 日付を解析 (例: "2/1(日)" -> "2026-02-01")
      const dateMatch = dateText.match(/(\d+)\/(\d+)/);
      if (!dateMatch) return;

      const month = parseInt(dateMatch[1], 10);
      const day = parseInt(dateMatch[2], 10);
      const year = new Date().getFullYear(); // 現在の年を使用
      const eventDate = new Date(year, month - 1, day);

      // イベントタイプを推測（演者名から）
      let eventType = "来店";
      if (actorName.includes("取材")) {
        eventType = "取材";
      } else if (actorName.includes("実践")) {
        eventType = "実践";
      }

      events.push({
        storeName,
        area: prefecture,
        eventDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        eventType,
        actorName,
        rating: rating ? parseFloat(rating) : undefined,
        sourceUrl: url,
        scrapedAt: new Date(),
      });
    });

    console.log(`[RaitenEx] Scraped ${events.length} events`);
    return events;
  } catch (error) {
    console.error("[RaitenEx] Scraping failed:", error);
    return [];
  }
}

/**
 * raiten-ex.comのアツさレベルを計算
 * 総合評価を基準に計算
 */
export function getHeatLevel(eventType: string, rating?: number): number {
  // ratingがある場合は、総合評価から計算
  if (rating !== undefined) {
    if (rating >= 4.5) return 5;
    if (rating >= 4.0) return 4;
    if (rating >= 3.5) return 3;
    if (rating >= 3.0) return 2;
    return 1;
  }

  // ratingがない場合はデフォルト
  return 3;
}

/**
 * raiten-ex.comの店舗住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

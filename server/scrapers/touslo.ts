import axios from "axios";
import * as cheerio from "cheerio";

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
 * touslo777souko.blog.jpから取材情報をスクレイピング
 */
export async function scrapeTouslo(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    console.log("[Touslo] Starting scraping...");
    
    const response = await axios.get("https://touslo777souko.blog.jp/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const currentYear = new Date().getFullYear();

    // 日付とエリアのリンクから情報を抽出
    // 例：「2/1(日)東京都」「1/31(土)神奈川県」
    $("a").each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const href = $el.attr("href");

      if (!href) return;

      // 日付とエリアのパターンを検出
      const match = text.match(/(\d+)\/(\d+)\((月|火|水|木|金|土|日)\)(栃木県|東京都|千葉県|神奈川県|埼玉県)/);
      if (!match) return;

      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const area = match[4].replace(/[都県]$/, "");
      const eventDate = parseDateString(`${month}月${day}日`, currentYear);

      const fullUrl = href.startsWith("http") ? href : `https://touslo777souko.blog.jp${href}`;

      // tousloは日付別のまとめページなので、
      // 個別の店舗情報は取得できない
      // そのため、エリア全体のイベントとして登録
      events.push({
        storeName: `${area}エリア取材`,
        area,
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

    console.log(`[Touslo] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[Touslo] Error:", error);
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
  return 3;
}

/**
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

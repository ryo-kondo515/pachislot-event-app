import axios from "axios";
import * as cheerio from "cheerio";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD形式
  eventType: string; // マグロ、ジャンドリ、極上、あがり、海鮮ドン等
  sourceUrl: string;
  scrapedAt: Date;
}

/**
 * イベントタイプからアツさレベルを判定
 */
export function getHeatLevel(eventType: string): number {
  const type = eventType.toLowerCase();
  if (type.includes("マグロ") || type.includes("maguro")) return 5;
  if (type.includes("ジャンドリ") || type.includes("jyandri")) return 4;
  if (type.includes("極上") || type.includes("gokujo")) return 4;
  if (type.includes("あがり") || type.includes("agari")) return 3;
  if (type.includes("海鮮ドン") || type.includes("kaisendon")) return 3;
  return 2; // デフォルト
}

/**
 * 日付文字列（例：1月25日(日)）をYYYY-MM-DD形式に変換
 */
function parseDateString(dateStr: string, year: number = new Date().getFullYear()): string {
  // 例：「1月25日(日)」→「2026-01-25」
  const match = dateStr.match(/(\d+)月(\d+)日/);
  if (!match) return new Date().toISOString().split("T")[0];
  
  const month = match[1].padStart(2, "0");
  const day = match[2].padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * drillermaguro.comから取材結果一覧をスクレイピング
 */
export async function scrapeDrillerMaguro(): Promise<ScrapedEvent[]> {
  const url = "https://drillermaguro.com/";
  const events: ScrapedEvent[] = [];

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const currentYear = new Date().getFullYear();

    // 最新取材結果セクションから情報を抽出
    // セレクタは実際のHTML構造に合わせて調整が必要
    $("a[href*='/interview/']").each((_, element) => {
      const $el = $(element);
      const href = $el.attr("href");
      const text = $el.text().trim();

      if (!href || !text) return;

      // テキストから情報を抽出
      // 例：「1月25日(日)アビバ湘南台ジャンドリ結果まとめ【注文結果】」
      const dateMatch = text.match(/(\d+月\d+日)/);
      const storeMatch = text.match(/\d+日\)(.+?)(マグロ|ジャンドリ|極上|あがり|海鮮ドン|イロドリル|夢ドリ|山狩)/);
      const eventTypeMatch = text.match(/(マグロ|ジャンドリ|極上|あがり|海鮮ドン|イロドリル|夢ドリ|山狩)/);

      if (!dateMatch || !storeMatch || !eventTypeMatch) return;

      const eventDate = parseDateString(dateMatch[1], currentYear);
      const storeName = storeMatch[1].trim();
      const eventType = eventTypeMatch[1];

      // エリア情報を取得（サイドバーやテキストから）
      let area = "不明";
      const areaMatch = $el.closest("div, li").text().match(/(東京|神奈川|埼玉|千葉|宮城|北海道)/);
      if (areaMatch) {
        area = areaMatch[1];
      }

      const fullUrl = href.startsWith("http") ? href : `https://drillermaguro.com${href}`;

      events.push({
        storeName,
        area,
        eventDate,
        eventType,
        sourceUrl: fullUrl,
        scrapedAt: new Date(),
      });
    });

    // 重複を除去（同じ店舗・日付・イベントタイプの組み合わせ）
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex((e) => 
        e.storeName === event.storeName && 
        e.eventDate === event.eventDate && 
        e.eventType === event.eventType
      )
    );

    console.log(`[DrillerMaguro] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[DrillerMaguro] Scraping error:", error);
    return [];
  }
}

/**
 * 店舗名から住所を推測（簡易版）
 * 実際にはGoogle Maps APIやジオコーディングサービスを使用する
 */
export function guessStoreAddress(storeName: string, area: string): string {
  // 簡易的な住所推測
  // 実際の実装では、店舗マスタDBやGoogle Maps APIを使用
  const areaMap: Record<string, string> = {
    "東京": "東京都",
    "神奈川": "神奈川県",
    "埼玉": "埼玉県",
    "千葉": "千葉県",
    "宮城": "宮城県",
    "北海道": "北海道",
  };

  return `${areaMap[area] || area}${storeName}`;
}

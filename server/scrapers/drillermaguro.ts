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
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
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
    });

    const $ = cheerio.load(response.data);
    const currentYear = new Date().getFullYear();

    // 取材結果一覧のリンクを取得
    $("a[href*='/interview/']").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      // リンクテキストから情報を抽出
      let text = $(element).text().trim();
      
      // 改行と余分な空白を削除
      text = text.replace(/\s+/g, " ").trim();

      // エリアを検索（最初に出現するエリア名）
      const areaMatch = text.match(/(東京|神奈川|千葉|埼玉|茨城|群馬|栃木|大阪|京都|兵庫|愛知|福岡|北海道|宮城)/);
      if (!areaMatch) return;

      const area = areaMatch[1];

      // 日付を検索
      const dateMatch = text.match(/(\d+)月(\d+)日/);
      if (!dateMatch) return;

      // イベントタイプを検索
      const eventTypeMatch = text.match(/(マグロ|ジャンドリ|極上|あがり|海鮮ドン|イロドリル|夢ドリ|山狩)/);
      if (!eventTypeMatch) return;

      const eventType = eventTypeMatch[1];

      // 店舗名を抽出（日付の後、イベントタイプの前）
      const storeMatch = text.match(/\d+日\(.*?\)(.+?)(マグロ|ジャンドリ|極上|あがり|海鮮ドン|イロドリル|夢ドリ|山狩)/);
      if (!storeMatch) return;

      const storeName = storeMatch[1].trim();
      const eventDate = parseDateString(`${dateMatch[1]}月${dateMatch[2]}日`, currentYear);

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

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
 * offme.jpから取材情報をスクレイピング
 */
export async function scrapeOffme(): Promise<ScrapedEvent[]> {
  const events: ScrapedEvent[] = [];

  try {
    console.log("[Offme] Starting scraping...");
    
    const response = await axios.get("https://offme.jp/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const currentYear = new Date().getFullYear();

    // offme.jpは構造が複雑なため、
    // 店舗名のパターンを検出して抽出する
    const storePatterns = [
      /横浜マリーン/,
      /楽園/,
      /Durham/,
      /メガコンコルド/,
      /キング観光/,
      /サウザンド/,
      /ワンダーランド/,
      /マリオンガーデン/,
      /ウシオ/,
    ];

    const excludePatterns = /(スケジュール|結果レポート|主催者|店舗情報|オフミーTV|もっと見る|運営会社|プライバシーポリシー|お問い合わせ|オフミー|戻る|ログイン|会員登録|開催店舗|来店|取材|グラレポ|でらミフオ|連続取材班|ワンデー取材班)/;

    $("a").each((_, element) => {
      const $el = $(element);
      const text = $el.text().trim();
      const href = $el.attr("href");

      if (!href || !text) return;

      // 店舗名のパターンに一致するかチェック
      const isStore = storePatterns.some(pattern => pattern.test(text));
      if (!isStore || text.match(excludePatterns)) return;

      // 店舗名を取得
      const storeName = text;

      // 前後のリンクから日付とエリアを取得
      const $parent = $el.parent();
      const allText = $parent.text();

      // 日付情報を検出（例：1/31 土曜日）
      const dateMatch = allText.match(/(\d+)\/(\d+)\s*(月|火|水|木|金|土|日)曜日/);
      if (!dateMatch) return;

      const month = parseInt(dateMatch[1]);
      const day = parseInt(dateMatch[2]);
      const eventDate = parseDateString(`${month}月${day}日`, currentYear);

      // エリア情報を検出
      const areaMatch = allText.match(/(北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県)/);
      if (!areaMatch) return;

      const area = areaMatch[1].replace(/[都道府県]$/, "");

      // 企画名を検出
      let eventType = "取材";
      if (allText.includes("グラレポ")) eventType = "グラレポ取材";
      else if (allText.includes("AIでらミフオ")) eventType = "AIでらミフオ来店";
      else if (allText.includes("だるま")) eventType = "だるま襲来";
      else if (allText.includes("来店")) eventType = "来店";

      const fullUrl = href.startsWith("http") ? href : `https://offme.jp${href}`;

      events.push({
        storeName,
        area,
        eventDate,
        eventType,
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

    console.log(`[Offme] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[Offme] Error:", error);
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
  if (eventType.includes("グラレポ")) return 4;
  if (eventType.includes("AI")) return 4;
  if (eventType.includes("だるま")) return 5;
  return 3;
}

/**
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

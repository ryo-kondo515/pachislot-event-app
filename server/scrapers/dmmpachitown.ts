import * as cheerio from "cheerio";
import { fetchPageWithPuppeteer } from "./puppeteer-utils";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD形式
  eventType: string;
  actorName?: string; // 演者名
  sourceUrl: string;
  scrapedAt: Date;
}

/**
 * DMMぱちタウンから来店イベント情報をスクレイピング
 */
export async function scrapeDmmPachitown(): Promise<ScrapedEvent[]> {
  const baseUrl = "https://p-town.dmm.com/schedules/";
  console.log("[DmmPachitown] Starting scraping...");

  try {
    const html = await fetchPageWithPuppeteer(baseUrl, {
      timeout: 30000,
      retries: 3,
    });

    if (!html) {
      console.error("[DmmPachitown] Failed to fetch HTML");
      return [];
    }

    const $ = cheerio.load(html);
    const events: ScrapedEvent[] = [];

    // 日付見出しを処理
    $("h3.c-h3.-shop").each((_, h3Element) => {
      const $h3 = $(h3Element);
      const dateText = $h3.find("p.title").text().trim();

      // 日付を解析（例：2026/02/11(水)）
      const dateMatch = dateText.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (!dateMatch) return;

      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);
      const eventDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // この日付の次のul要素を探す
      const $ul = $h3.nextAll("ul.list-units").first();
      if ($ul.length === 0) return;

      // 各イベント（li要素）を処理
      $ul.find("li.unit").each((_, liElement) => {
        const $li = $(liElement);
        const $link = $li.find("a.link");

        if ($link.length === 0) return;

        const href = $link.attr("href");
        if (!href || href === "/shops/open") return; // グランドオープンはスキップ

        // 店舗名を取得
        const storeName = $link.find("p.title._ellipsis").first().text().trim();
        if (!storeName) return;

        // 住所から都道府県を抽出
        const address = $link.find("p.lead").first().text().trim();
        let area = extractPrefectureFromAddress(address);

        // 住所から抽出できない場合はURLから
        if (!area) {
          const urlMatch = href.match(/\/shops\/([^\/]+)\//);
          if (urlMatch) {
            area = convertPrefectureSlug(urlMatch[1]);
          }
        }

        if (!area) return;

        // イベント名を取得
        const eventName = $link.find("span.text-icon").text().trim();
        let eventType = "来店";

        if (eventName) {
          if (eventName.includes("収録")) {
            eventType = "収録";
          } else if (eventName.includes("取材")) {
            eventType = "取材";
          } else if (eventName.includes("実践")) {
            eventType = "実践";
          } else {
            eventType = eventName || "来店";
          }
        }

        const fullUrl = href.startsWith("http") ? href : `https://p-town.dmm.com${href}`;

        events.push({
          storeName,
          area,
          eventDate,
          eventType,
          actorName: undefined,
          sourceUrl: fullUrl,
          scrapedAt: new Date(),
        });
      });
    });

    // 重複を除去
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex((e) =>
        e.storeName === event.storeName &&
        e.eventDate === event.eventDate &&
        e.eventType === event.eventType
      )
    );

    console.log(`[DmmPachitown] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[DmmPachitown] Scraping error:", error);
    return [];
  }
}

/**
 * 住所文字列から都道府県名を抽出
 */
function extractPrefectureFromAddress(address: string): string {
  const prefectures = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
  ];

  for (const pref of prefectures) {
    if (address.startsWith(pref)) {
      // 都道府県から「都」「道」「府」「県」を除去
      return pref.replace(/[都道府県]$/, "");
    }
  }

  return "";
}

/**
 * URLスラッグを都道府県名に変換
 */
function convertPrefectureSlug(slug: string): string {
  const prefectureMap: Record<string, string> = {
    "hokkaido": "北海道",
    "aomori": "青森",
    "iwate": "岩手",
    "miyagi": "宮城",
    "akita": "秋田",
    "yamagata": "山形",
    "fukushima": "福島",
    "ibaraki": "茨城",
    "tochigi": "栃木",
    "gunma": "群馬",
    "saitama": "埼玉",
    "chiba": "千葉",
    "tokyo": "東京",
    "kanagawa": "神奈川",
    "niigata": "新潟",
    "toyama": "富山",
    "ishikawa": "石川",
    "fukui": "福井",
    "yamanashi": "山梨",
    "nagano": "長野",
    "gifu": "岐阜",
    "shizuoka": "静岡",
    "aichi": "愛知",
    "mie": "三重",
    "shiga": "滋賀",
    "kyoto": "京都",
    "osaka": "大阪",
    "hyogo": "兵庫",
    "nara": "奈良",
    "wakayama": "和歌山",
    "tottori": "鳥取",
    "shimane": "島根",
    "okayama": "岡山",
    "hiroshima": "広島",
    "yamaguchi": "山口",
    "tokushima": "徳島",
    "kagawa": "香川",
    "ehime": "愛媛",
    "kochi": "高知",
    "fukuoka": "福岡",
    "saga": "佐賀",
    "nagasaki": "長崎",
    "kumamoto": "熊本",
    "oita": "大分",
    "miyazaki": "宮崎",
    "kagoshima": "鹿児島",
    "okinawa": "沖縄",
  };

  return prefectureMap[slug] || slug;
}

/**
 * イベントタイプからアツさレベルを判定
 */
export function getHeatLevel(eventType: string, rating?: number): number {
  const type = eventType.toLowerCase();

  if (type.includes("収録")) return 4;
  if (type.includes("来店") || type.includes("実践")) return 3;
  if (type.includes("取材")) return 3;

  return 2; // デフォルト
}

/**
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

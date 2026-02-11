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
 * スロパチステーションから来店イベント情報をスクレイピング
 */
export async function scrapeSlopachiStation(): Promise<ScrapedEvent[]> {
  const baseUrl = "https://777.slopachi-station.com/report_schedule/";
  console.log("[SlopachiStation] Starting scraping...");

  const allEvents: ScrapedEvent[] = [];

  try {
    // 最初のページのみをスクレイピング（ページネーション対応は後で追加可能）
    const events = await scrapePage(baseUrl, 1);
    allEvents.push(...events);

    // 重複を除去
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex((e) =>
        e.storeName === event.storeName &&
        e.eventDate === event.eventDate &&
        e.eventType === event.eventType
      )
    );

    console.log(`[SlopachiStation] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[SlopachiStation] Scraping error:", error);
    return [];
  }
}

/**
 * 指定ページのイベント情報をスクレイピング
 */
async function scrapePage(baseUrl: string, page: number): Promise<ScrapedEvent[]> {
  const url = page === 1 ? baseUrl : `${baseUrl}page/${page}/`;

  const html = await fetchPageWithPuppeteer(url, {
    timeout: 30000,
    retries: 3,
  });

  if (!html) {
    console.error("[SlopachiStation] Failed to fetch HTML");
    return [];
  }

  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();

  // 店舗リンクを含む要素を検索（フルURLにも対応）
  $("a[href*='/shop_data/']").each((_, element) => {
    const $link = $(element);
    const href = $link.attr("href");

    if (!href) return;

    // リンクの親要素（resultRow-detail）を取得
    const $detailDiv = $link.closest(".resultRow-detail");
    if ($detailDiv.length === 0) return;

    // テキストコンテンツ全体を取得
    const contextText = $detailDiv.text();

    // 日付を抽出（例：2/11 (水)）
    const dateMatch = contextText.match(/(\d{1,2})\/(\d{1,2})\s*\(/);
    if (!dateMatch) return;

    const month = parseInt(dateMatch[1], 10);
    const day = parseInt(dateMatch[2], 10);

    // 月が現在より小さい場合は来年の日付と判定
    const currentMonth = new Date().getMonth() + 1;
    const targetYear = month < currentMonth ? currentYear + 1 : currentYear;
    const eventDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // 都道府県を抽出（【】内）
    const prefectureMatch = contextText.match(/【([^】]+)】/);
    let area = "";
    if (prefectureMatch) {
      area = prefectureMatch[1];
      // 市区町村情報が含まれている場合は都道府県名のみ抽出
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
        if (area.includes(pref)) {
          // 都道府県から「都」「道」「府」「県」を除去
          area = pref.replace(/[都道府県]$/, "");
          break;
        }
      }
    }

    if (!area) return;

    // リンクテキストからイベントタイプと店舗名を抽出
    // 形式: "スロぱちガール来店PS  マルハン相模原店"
    const linkText = $link.text().trim();
    if (!linkText) return;

    // 複数のスペースで分割
    const parts = linkText.split(/\s{2,}/);
    let storeName = "";
    let eventType = "来店";
    let actorName: string | undefined;

    if (parts.length >= 2) {
      // 最後の部分が店舗名
      storeName = parts[parts.length - 1].trim();
      // 最初の部分がイベントタイプ
      const eventTypePart = parts[0].trim();

      // イベントタイプを判定
      if (eventTypePart.includes("ガール")) {
        eventType = "ガール来店";
      } else if (eventTypePart.includes("収録")) {
        eventType = "収録";
      } else if (eventTypePart.includes("取材")) {
        eventType = "取材";
      } else if (eventTypePart.includes("実践")) {
        eventType = "実践";
      } else if (eventTypePart.includes("来店")) {
        eventType = "来店";
      }

      // 演者名を抽出（イベントタイプの前の部分）
      const actorMatch = eventTypePart.match(/^([ぁ-んァ-ヶー一-龠]+)(?:来店|取材|収録|実践)/);
      if (actorMatch) {
        actorName = actorMatch[1];
      }
    } else {
      // スペース区切りがない場合
      storeName = linkText;
    }

    if (!storeName) return;

    const fullUrl = href.startsWith("http") ? href : `https://777.slopachi-station.com${href}`;

    events.push({
      storeName,
      area,
      eventDate,
      eventType,
      actorName,
      sourceUrl: fullUrl,
      scrapedAt: new Date(),
    });
  });

  return events;
}

/**
 * イベントタイプからアツさレベルを判定
 */
export function getHeatLevel(eventType: string, rating?: number): number {
  const type = eventType.toLowerCase();

  if (type.includes("収録")) return 4;
  if (type.includes("ガール来店")) return 3;
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

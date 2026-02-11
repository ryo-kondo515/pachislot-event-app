import * as cheerio from "cheerio";
import axios from "axios";

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
 * P-WORLDから来店イベント情報をスクレイピング
 */
export async function scrapePworld(): Promise<ScrapedEvent[]> {
  const baseUrl = "https://www.p-world.co.jp/hall/interviews/prefs";
  console.log("[Pworld] Starting scraping...");

  try {
    // 最初のページのみをスクレイピング（ページネーション対応は後で追加可能）
    const events = await scrapePage(baseUrl);

    // 重複を除去
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex((e) =>
        e.storeName === event.storeName &&
        e.eventDate === event.eventDate &&
        e.eventType === event.eventType
      )
    );

    console.log(`[Pworld] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[Pworld] Scraping error:", error);
    return [];
  }
}

/**
 * 指定URLのイベント情報をスクレイピング
 */
async function scrapePage(url: string): Promise<ScrapedEvent[]> {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    timeout: 30000,
  });

  const $ = cheerio.load(response.data);
  const events: ScrapedEvent[] = [];
  const currentYear = new Date().getFullYear();

  // 各店舗カードを処理
  $(".hallList-item").each((_, itemElement) => {
    const $item = $(itemElement);

    // 店舗名を取得
    const $storeLink = $item.find(".hallList-item-name-link");
    const storeName = $storeLink.text().trim();
    const storeUrl = $storeLink.attr("href") || "";

    if (!storeName || !storeUrl) return;

    // 住所から都道府県を抽出
    const address = $item.find(".hallList-item-address").first().text().trim();
    const area = extractPrefectureFromAddress(address);

    if (!area) return;

    // イベント情報を取得（1店舗に複数イベントがある場合もある）
    $item.find(".hallList-interview").each((_, interviewElement) => {
      const $interview = $(interviewElement);

      // イベントタイプを取得（取材/来店）
      const eventTypeText = $interview.find(".hallList-interview-type").text().trim();
      let eventType = eventTypeText || "来店";

      // イベントタイトルを取得
      const eventTitle = $interview.find(".hallList-interview-title").text().trim();

      // 日付を取得（例：02/11(水)）
      const dateText = $interview.find(".hallList-interview-date").text().trim();
      const dateMatch = dateText.match(/(\d{1,2})\/(\d{1,2})/);

      if (!dateMatch) return;

      const month = parseInt(dateMatch[1], 10);
      const day = parseInt(dateMatch[2], 10);

      // 月が現在より小さい場合は来年の日付と判定
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = month < currentMonth ? currentYear + 1 : currentYear;
      const eventDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // 演者名を抽出（タイトルから）
      let actorName: string | undefined;

      // パターン1: 「〜さん」「〜くん」
      const actorMatch1 = eventTitle.match(/([ぁ-んァ-ヶー一-龠]+)(?:さん|くん|氏)/);
      if (actorMatch1) {
        actorName = actorMatch1[1];
      }

      // パターン2: 「〜来店」「〜取材」
      if (!actorName) {
        const actorMatch2 = eventTitle.match(/([ぁ-んァ-ヶー一-龠]+)(?:来店|取材|収録|実践)/);
        if (actorMatch2) {
          actorName = actorMatch2[1];
        }
      }

      // 演者名のクリーンアップ
      if (actorName) {
        actorName = actorName
          .replace(/来店実践?/g, "")
          .replace(/来店/g, "")
          .replace(/収録/g, "")
          .replace(/取材/g, "")
          .replace(/実践/g, "")
          .trim();

        if (!actorName) {
          actorName = undefined;
        }
      }

      const fullUrl = storeUrl.startsWith("http") ? storeUrl : `https://www.p-world.co.jp${storeUrl}`;

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
  });

  return events;
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
 * イベントタイプからアツさレベルを判定
 */
export function getHeatLevel(eventType: string, rating?: number): number {
  const type = eventType.toLowerCase();

  if (type.includes("収録")) return 4;
  if (type.includes("取材")) return 3;
  if (type.includes("来店") || type.includes("実践")) return 3;

  return 2; // デフォルト
}

/**
 * 店舗名とエリアから住所を推測
 */
export function guessStoreAddress(storeName: string, area: string): string {
  return `${area}${storeName}`;
}

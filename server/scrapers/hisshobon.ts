import * as cheerio from "cheerio";
import axios from "axios";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD形式
  eventType: string;
  actorName?: string; // ライター名
  sourceUrl: string;
  scrapedAt: Date;
}

/**
 * 必勝本ホール情報から来店イベント情報をスクレイピング
 */
export async function scrapeHisshobon(): Promise<ScrapedEvent[]> {
  const url = "https://hisshobon-hall.info/tag/raiten/";
  console.log("[Hisshobon] Starting scraping...");

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const events: ScrapedEvent[] = [];
    const currentYear = new Date().getFullYear();

    // リスト形式のイベント情報を取得
    $("li a").each((_, element) => {
      const $el = $(element);
      const href = $el.attr("href");

      if (!href) return;

      // リンク内のテキストを取得（改行と余分な空白を削除）
      const text = $el.text().trim().replace(/\s+/g, " ");

      // 「｜」で区切られたテキストを分割
      // フォーマット: 日付｜店舗名｜都道府県｜イベント説明｜ライター名
      const parts = text.split("｜").map(p => p.trim());

      if (parts.length < 4) return; // 最低限の情報がない場合はスキップ

      // 日付を解析（例：02/11 -> 2月11日）
      const dateMatch = parts[0].match(/(\d{1,2})\/(\d{1,2})/);
      if (!dateMatch) return;

      const month = parseInt(dateMatch[1], 10);
      const day = parseInt(dateMatch[2], 10);

      // 月または日が不正な値の場合はスキップ
      if (month < 1 || month > 12 || day < 1 || day > 31) return;

      // 月が現在より小さい場合は来年の日付と判定
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = month < currentMonth ? currentYear + 1 : currentYear;
      const eventDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // 店舗名を取得
      const storeName = parts[1];
      if (!storeName) return;

      // 都道府県を取得
      let area = parts[2];
      // 都道府県名を正規化（「東京都」→「東京」）
      area = area.replace(/[都道府県]$/, "");

      // イベントタイプを取得（3番目の要素からキーワードを抽出）
      let eventType = "来店";
      if (parts[3]) {
        if (parts[3].includes("収録")) {
          eventType = "収録";
        } else if (parts[3].includes("取材")) {
          eventType = "取材";
        } else if (parts[3].includes("実践")) {
          eventType = "実践";
        }
      }

      // ライター名を取得（最後の要素、カンマ区切りの場合は最初の名前のみ）
      let actorName: string | undefined;
      if (parts.length >= 5 && parts[4]) {
        const writers = parts[4].split(",");
        actorName = writers[0].trim();
      } else if (parts.length >= 4 && parts[3]) {
        // イベント説明からライター名を抽出（最後の単語）
        const words = parts[3].trim().split(/\s+/);
        const lastWord = words[words.length - 1];
        // ライター名らしい文字列（ひらがな・カタカナ・漢字のみ）
        if (lastWord && /^[ぁ-んァ-ヶー一-龠]+$/.test(lastWord)) {
          actorName = lastWord;
        }
      }

      // 演者名のクリーンアップ（「来店」「収録」「取材」「実践」を除去）
      if (actorName) {
        actorName = actorName
          .replace(/来店実践?/g, "")
          .replace(/来店/g, "")
          .replace(/収録/g, "")
          .replace(/取材/g, "")
          .replace(/実践/g, "")
          .replace(/\s+/g, "")
          .trim();

        // 空文字列になった場合はundefined
        if (!actorName) {
          actorName = undefined;
        }
      }

      const fullUrl = href.startsWith("http") ? href : `https://hisshobon-hall.info${href}`;

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

    // 重複を除去
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex((e) =>
        e.storeName === event.storeName &&
        e.eventDate === event.eventDate &&
        e.eventType === event.eventType
      )
    );

    console.log(`[Hisshobon] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[Hisshobon] Scraping error:", error);
    return [];
  }
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

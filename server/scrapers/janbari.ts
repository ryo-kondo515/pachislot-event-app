import * as cheerio from "cheerio";
import axios from "axios";

export interface ScrapedEvent {
  storeName: string;
  area: string;
  eventDate: string; // YYYY-MM-DD形式
  eventType: string;
  actorName?: string; // パフォーマー名
  sourceUrl: string;
  scrapedAt: Date;
}

/**
 * ジャンバリTV（ポータル版）から来店イベント情報をスクレイピング
 */
export async function scrapeJanbari(): Promise<ScrapedEvent[]> {
  const url = "https://jb-portal.com/schedule/";
  console.log("[Janbari] Starting scraping...");

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

    // 日付ごとのセクションを処理
    $("h4").each((_, dateHeader) => {
      const $dateHeader = $(dateHeader);
      const dateText = $dateHeader.text().trim();

      // 日付を解析（例：「2月11日(水)」）
      const dateMatch = dateText.match(/(\d+)月(\d+)日/);
      if (!dateMatch) return;

      const month = parseInt(dateMatch[1], 10);
      const day = parseInt(dateMatch[2], 10);

      // 月が現在より小さい場合は来年の日付と判定
      const currentMonth = new Date().getMonth() + 1;
      const targetYear = month < currentMonth ? currentYear + 1 : currentYear;
      const eventDate = `${targetYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // この日付のh4の後続要素から、次のh4までのa要素を取得
      let $next = $dateHeader.next();

      while ($next.length > 0 && !$next.is("h4")) {
        if ($next.is("a") && $next.attr("href")?.startsWith("/hall/")) {
          const $link = $next;
          const href = $link.attr("href");

          if (!href) {
            $next = $next.next();
            continue;
          }

          // リンク内のテキストを取得
          const text = $link.text().trim();

          // イベントタイプを判定（画像のsrcから）
          let eventType = "来店";
          const $typeIcon = $link.find("img[src*='/report/']");
          if ($typeIcon.length > 0) {
            const iconSrc = $typeIcon.attr("src") || "";
            if (iconSrc.includes("shuroku")) {
              eventType = "収録";
            } else if (iconSrc.includes("raiten")) {
              eventType = "来店";
            }
          }

          // 都道府県を抽出（一般的な都道府県名のパターン）
          const prefectures = [
            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
            "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
            "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜",
            "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫",
            "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口",
            "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎",
            "熊本", "大分", "宮崎", "鹿児島", "沖縄"
          ];

          let area = "";
          for (const pref of prefectures) {
            if (text.includes(pref)) {
              area = pref;
              break;
            }
          }

          if (!area) {
            $next = $next.next();
            continue; // 都道府県が見つからない場合はスキップ
          }

          // 店舗名を抽出（都道府県名の後の部分）
          const storeMatch = text.match(new RegExp(`${area}[\\s　]*([^\\s　]+(?:[^\\n]*?)?)(?=\\s|$)`));
          let storeName = "";
          if (storeMatch && storeMatch[1]) {
            storeName = storeMatch[1].trim();
            // 余分な情報を除去（例：番組名など）
            storeName = storeName.split(/\s+/)[0];
          }

          if (!storeName) {
            $next = $next.next();
            continue;
          }

          // パフォーマー名を抽出（画像のaltまたはファイル名から）
          let actorName: string | undefined;
          const $performerImg = $link.find("img[src*='/performer/']");
          if ($performerImg.length > 0) {
            // まずalt属性を確認
            const alt = $performerImg.attr("alt");
            if (alt && alt.trim()) {
              actorName = alt.trim();
            } else {
              // altがない場合はファイル名から抽出（アンダースコアを削除）
              const performerSrc = $performerImg.attr("src") || "";
              const performerMatch = performerSrc.match(/\/performer\/(?:jbp_icon_)?(.+?)\.(?:jpg|png|gif)/);
              if (performerMatch) {
                // ファイル名のプレフィックスを除去し、アンダースコアをスペースに変換
                actorName = performerMatch[1]
                  .replace(/_/g, " ")
                  .trim();
              }
            }
          }

          const fullUrl = `https://jb-portal.com${href}`;

          events.push({
            storeName,
            area,
            eventDate,
            eventType,
            actorName,
            sourceUrl: fullUrl,
            scrapedAt: new Date(),
          });
        }

        $next = $next.next();
      }
    });

    // 重複を除去
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex((e) =>
        e.storeName === event.storeName &&
        e.eventDate === event.eventDate &&
        e.eventType === event.eventType
      )
    );

    console.log(`[Janbari] Scraped ${uniqueEvents.length} events`);
    return uniqueEvents;

  } catch (error) {
    console.error("[Janbari] Scraping error:", error);
    return [];
  }
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

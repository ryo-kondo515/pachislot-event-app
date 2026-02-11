/**
 * スクレイピングデータの重複排除ユーティリティ
 */

import type { ScrapedEvent } from "./index";

/**
 * 店舗名を正規化
 * - 全角英数字を半角に変換
 * - 全角スペースを半角に変換
 * - 記号を統一
 * - 連続するスペースを1つに
 * - 前後の空白を削除
 */
export function normalizeStoreName(name: string): string {
  return name
    // 全角英数字を半角に変換
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    // 全角スペースを半角に
    .replace(/　/g, " ")
    // 全角記号を半角に
    .replace(/！/g, "!")
    .replace(/？/g, "?")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .replace(/＆/g, "&")
    .replace(/～/g, "~")
    // 前後の空白を削除
    .trim()
    // すべてのスペースを削除（表記ゆれ対応）
    .replace(/\s+/g, "")
    // 小文字に統一
    .toLowerCase();
}

/**
 * イベント日付を正規化（YYYY-MM-DD形式に統一）
 */
export function normalizeEventDate(date: string | Date): string {
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return date;
}

/**
 * 2つの店舗名が同一かどうかをチェック
 * - 正規化後の完全一致
 * - 部分一致（短い方が長い方に含まれる場合）
 */
export function isSameStore(name1: string, name2: string): boolean {
  const normalized1 = normalizeStoreName(name1);
  const normalized2 = normalizeStoreName(name2);

  // 完全一致
  if (normalized1 === normalized2) {
    return true;
  }

  // 部分一致（短い方が長い方に80%以上含まれる場合）
  const shorter = normalized1.length < normalized2.length ? normalized1 : normalized2;
  const longer = normalized1.length < normalized2.length ? normalized2 : normalized1;

  // 短い方が3文字以下の場合は完全一致のみ
  if (shorter.length <= 3) {
    return false;
  }

  // 短い方が長い方に含まれるかチェック
  if (longer.includes(shorter)) {
    // 含まれる場合、長さの比率をチェック
    const ratio = shorter.length / longer.length;
    return ratio >= 0.7; // 70%以上一致していれば同一とみなす
  }

  return false;
}

/**
 * 2つのイベントが同一かどうかをチェック
 */
export function isSameEvent(event1: ScrapedEvent, event2: ScrapedEvent): boolean {
  // 日付が異なる場合は別イベント
  if (normalizeEventDate(event1.eventDate) !== normalizeEventDate(event2.eventDate)) {
    return false;
  }

  // エリアが異なる場合は別イベント
  if (event1.area !== event2.area) {
    return false;
  }

  // 店舗名が同一かチェック
  if (!isSameStore(event1.storeName, event2.storeName)) {
    return false;
  }

  // イベントタイプが同じまたは似ている場合は同一イベント
  const type1 = event1.eventType.toLowerCase();
  const type2 = event2.eventType.toLowerCase();

  // 完全一致
  if (type1 === type2) {
    return true;
  }

  // 「取材」と「来店」は異なるイベント
  if ((type1.includes("取材") && type2.includes("来店")) ||
      (type1.includes("来店") && type2.includes("取材"))) {
    return false;
  }

  // その他の類似判定
  // 例：「収録」「収録来店」など
  if (type1.includes(type2) || type2.includes(type1)) {
    return true;
  }

  return false;
}

/**
 * イベントリストから重複を除去
 * より詳細な情報（演者名など）を持つイベントを優先
 */
export function deduplicateEvents(events: ScrapedEvent[]): {
  uniqueEvents: ScrapedEvent[];
  duplicates: Array<{ kept: ScrapedEvent; removed: ScrapedEvent[] }>;
} {
  const uniqueEvents: ScrapedEvent[] = [];
  const duplicates: Array<{ kept: ScrapedEvent; removed: ScrapedEvent[] }> = [];

  for (const event of events) {
    // 既存のuniqueEventsから同一イベントを探す
    const existingIndex = uniqueEvents.findIndex(e => isSameEvent(e, event));

    if (existingIndex === -1) {
      // 重複なし、新規追加
      uniqueEvents.push(event);
    } else {
      // 重複あり、より詳細な情報を持つ方を保持
      const existing = uniqueEvents[existingIndex];
      const better = chooseBetterEvent(existing, event);

      if (better === event) {
        // 新しいイベントの方が詳細、置き換え
        uniqueEvents[existingIndex] = event;

        // 重複情報を記録
        const dupRecord = duplicates.find(d => d.kept === event);
        if (dupRecord) {
          dupRecord.removed.push(existing);
        } else {
          duplicates.push({ kept: event, removed: [existing] });
        }
      } else {
        // 既存イベントを保持、新しいイベントは破棄
        const dupRecord = duplicates.find(d => d.kept === existing);
        if (dupRecord) {
          dupRecord.removed.push(event);
        } else {
          duplicates.push({ kept: existing, removed: [event] });
        }
      }
    }
  }

  return { uniqueEvents, duplicates };
}

/**
 * 2つのイベントのうち、より詳細な情報を持つ方を選択
 */
function chooseBetterEvent(event1: ScrapedEvent, event2: ScrapedEvent): ScrapedEvent {
  let score1 = 0;
  let score2 = 0;

  // 演者名がある方が優先
  if (event1.actorName) score1 += 2;
  if (event2.actorName) score2 += 2;

  // より長い店舗名（詳細な可能性）
  score1 += event1.storeName.length * 0.1;
  score2 += event2.storeName.length * 0.1;

  // より新しいスクレイピング時刻
  if (event1.scrapedAt > event2.scrapedAt) score1 += 1;
  if (event2.scrapedAt > event1.scrapedAt) score2 += 1;

  // イベントタイプの詳細度
  if (event1.eventType.length > event2.eventType.length) score1 += 0.5;
  if (event2.eventType.length > event1.eventType.length) score2 += 0.5;

  return score1 >= score2 ? event1 : event2;
}

/**
 * 重複レポートを生成
 */
export function generateDuplicationReport(duplicates: Array<{ kept: ScrapedEvent; removed: ScrapedEvent[] }>): string {
  if (duplicates.length === 0) {
    return "重複なし";
  }

  let report = `\n重複イベント: ${duplicates.length}件\n`;
  report += "=".repeat(60) + "\n";

  duplicates.forEach((dup, i) => {
    report += `\n[${i + 1}] 保持: ${dup.kept.storeName} (${dup.kept.eventDate}) - ${dup.kept.eventType}\n`;
    report += `    ソース: ${dup.kept.sourceUrl}\n`;
    if (dup.kept.actorName) {
      report += `    演者: ${dup.kept.actorName}\n`;
    }
    report += `    削除された重複: ${dup.removed.length}件\n`;
    dup.removed.forEach((removed, j) => {
      report += `      [${j + 1}] ${removed.storeName} (${removed.eventDate}) - ${removed.eventType}\n`;
      report += `          ソース: ${removed.sourceUrl}\n`;
    });
  });

  return report;
}

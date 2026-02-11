/**
 * 重複チェック機能のテスト
 */

import { normalizeStoreName, isSameStore, isSameEvent, deduplicateEvents, generateDuplicationReport } from "../server/scrapers/deduplication-utils";
import type { ScrapedEvent } from "../server/scrapers/index";

function testNormalizeStoreName() {
  console.log("========================================");
  console.log("店舗名正規化のテスト");
  console.log("========================================\n");

  const testCases = [
    ["マルハン　相模原店", "マルハン相模原店"],
    ["ＢＡＮＢＡＮ＋１", "banban+1"],
    ["キコーナ南津守", "キコーナ南津守"],
    ["１２３門真店", "123門真店"],
  ];

  testCases.forEach(([input, expected], i) => {
    const normalized = normalizeStoreName(input);
    const match = normalized === expected.toLowerCase();
    console.log(`[${i + 1}] ${match ? "✓" : "✗"}`);
    console.log(`    入力: ${input}`);
    console.log(`    正規化: ${normalized}`);
    console.log(`    期待値: ${expected.toLowerCase()}\n`);
  });
}

function testIsSameStore() {
  console.log("========================================");
  console.log("店舗同一性判定のテスト");
  console.log("========================================\n");

  const testCases: Array<[string, string, boolean]> = [
    ["マルハン相模原店", "マルハン　相模原店", true],
    ["マルハン相模原", "マルハン相模原店", true],
    ["キコーナ吹田店", "キコーナ吹田", true],
    ["123門真店", "１２３門真店", true],
    ["マルハン相模原店", "マルハン横浜店", false],
    ["ABC", "XYZ", false],
  ];

  testCases.forEach(([name1, name2, expected], i) => {
    const result = isSameStore(name1, name2);
    const match = result === expected;
    console.log(`[${i + 1}] ${match ? "✓" : "✗"}`);
    console.log(`    ${name1} vs ${name2}`);
    console.log(`    結果: ${result ? "同一" : "別店舗"} (期待: ${expected ? "同一" : "別店舗"})\n`);
  });
}

function testIsSameEvent() {
  console.log("========================================");
  console.log("イベント同一性判定のテスト");
  console.log("========================================\n");

  const event1: ScrapedEvent = {
    storeName: "マルハン相模原店",
    area: "神奈川",
    eventDate: "2026-02-11",
    eventType: "取材",
    sourceUrl: "https://example.com/1",
    scrapedAt: new Date(),
  };

  const event2: ScrapedEvent = {
    storeName: "マルハン　相模原",
    area: "神奈川",
    eventDate: "2026-02-11",
    eventType: "取材",
    sourceUrl: "https://example.com/2",
    scrapedAt: new Date(),
  };

  const event3: ScrapedEvent = {
    storeName: "マルハン相模原店",
    area: "神奈川",
    eventDate: "2026-02-11",
    eventType: "来店",
    sourceUrl: "https://example.com/3",
    scrapedAt: new Date(),
  };

  const event4: ScrapedEvent = {
    storeName: "マルハン相模原店",
    area: "神奈川",
    eventDate: "2026-02-12",
    eventType: "取材",
    sourceUrl: "https://example.com/4",
    scrapedAt: new Date(),
  };

  const testCases: Array<[ScrapedEvent, ScrapedEvent, boolean, string]> = [
    [event1, event2, true, "同じ店舗、日付、イベントタイプ（表記ゆれあり）"],
    [event1, event3, false, "同じ店舗、日付だが異なるイベントタイプ"],
    [event1, event4, false, "同じ店舗だが異なる日付"],
  ];

  testCases.forEach(([ev1, ev2, expected, description], i) => {
    const result = isSameEvent(ev1, ev2);
    const match = result === expected;
    console.log(`[${i + 1}] ${match ? "✓" : "✗"} ${description}`);
    console.log(`    結果: ${result ? "同一イベント" : "別イベント"} (期待: ${expected ? "同一" : "別"})\n`);
  });
}

function testDeduplicateEvents() {
  console.log("========================================");
  console.log("重複除去のテスト");
  console.log("========================================\n");

  const events: ScrapedEvent[] = [
    {
      storeName: "マルハン相模原店",
      area: "神奈川",
      eventDate: "2026-02-11",
      eventType: "取材",
      actorName: "太郎",
      sourceUrl: "https://example.com/1",
      scrapedAt: new Date("2026-02-01T00:00:00"),
    },
    {
      storeName: "マルハン　相模原",
      area: "神奈川",
      eventDate: "2026-02-11",
      eventType: "取材",
      sourceUrl: "https://example.com/2",
      scrapedAt: new Date("2026-02-01T01:00:00"),
    },
    {
      storeName: "キコーナ吹田店",
      area: "大阪",
      eventDate: "2026-02-11",
      eventType: "来店",
      actorName: "花子",
      sourceUrl: "https://example.com/3",
      scrapedAt: new Date("2026-02-01T00:00:00"),
    },
    {
      storeName: "キコーナ吹田",
      area: "大阪",
      eventDate: "2026-02-11",
      eventType: "来店",
      actorName: "花子",
      sourceUrl: "https://example.com/4",
      scrapedAt: new Date("2026-02-01T00:00:00"),
    },
    {
      storeName: "123門真店",
      area: "大阪",
      eventDate: "2026-02-12",
      eventType: "収録",
      sourceUrl: "https://example.com/5",
      scrapedAt: new Date("2026-02-01T00:00:00"),
    },
  ];

  console.log(`入力イベント数: ${events.length}件\n`);

  const { uniqueEvents, duplicates } = deduplicateEvents(events);

  console.log(`重複除去後: ${uniqueEvents.length}件`);
  console.log(`重複数: ${duplicates.length}件\n`);

  if (duplicates.length > 0) {
    const report = generateDuplicationReport(duplicates);
    console.log(report);
  }

  console.log("\n保持されたユニークイベント:");
  uniqueEvents.forEach((event, i) => {
    console.log(`  ${i + 1}. ${event.storeName} (${event.area}) - ${event.eventDate} - ${event.eventType}`);
    if (event.actorName) {
      console.log(`     演者: ${event.actorName}`);
    }
  });
}

console.log("\n");
testNormalizeStoreName();
console.log("\n");
testIsSameStore();
console.log("\n");
testIsSameEvent();
console.log("\n");
testDeduplicateEvents();
console.log("\n========================================");
console.log("全てのテスト完了");
console.log("========================================\n");

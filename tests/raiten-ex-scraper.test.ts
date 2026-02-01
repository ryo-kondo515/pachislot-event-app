import { describe, it, expect } from "vitest";
import { scrapeRaitenEx } from "../server/scrapers/raitenex";

describe("raiten-ex.com scraper", () => {
  it("should scrape events from raiten-ex.com", async () => {
    const events = await scrapeRaitenEx();
    
    // 100件以上のイベントを取得できることを確認
    expect(events.length).toBeGreaterThan(100);
    
    // 最初のイベントのデータ構造を確認
    const firstEvent = events[0];
    expect(firstEvent).toHaveProperty("storeName");
    expect(firstEvent).toHaveProperty("area");
    expect(firstEvent).toHaveProperty("eventDate");
    expect(firstEvent).toHaveProperty("eventType");
    expect(firstEvent).toHaveProperty("actorName");
    expect(firstEvent).toHaveProperty("sourceUrl");
    
    // 店舗名が空でないことを確認
    expect(firstEvent.storeName).toBeTruthy();
    // エリアが空でないことを確認
    expect(firstEvent.area).toBeTruthy();
    // 演者名が空でないことを確認
    expect(firstEvent.actorName).toBeTruthy();
    
    // イベント日付が正しい形式であることを確認 (YYYY-MM-DD)
    expect(firstEvent.eventDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    
    // ソースURLが正しいことを確認
    expect(firstEvent.sourceUrl).toBe("https://raiten-ex.com/");
  }, 60000); // 60秒のタイムアウト
});

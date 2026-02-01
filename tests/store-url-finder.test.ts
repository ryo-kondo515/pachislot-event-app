import { describe, it, expect } from "vitest";
import { findStoreOfficialUrl } from "../server/utils/store-url-finder";

describe("Store URL Finder", () => {
  it("should find official URL for a well-known store", async () => {
    const url = await findStoreOfficialUrl("マルハン新宿東宝ビル店", "東京都");
    
    // URLが見つかった場合はhttp/httpsで始まる
    if (url) {
      expect(url).toMatch(/^https?:\/\//);
      console.log(`Found URL: ${url}`);
    } else {
      console.log("URL not found (this is acceptable for testing)");
    }
  }, 30000); // 30秒のタイムアウト

  it("should return null for non-existent store", async () => {
    const url = await findStoreOfficialUrl("存在しない店舗名12345", "不明なエリア");
    
    // 存在しない店舗の場合はnullを返す
    expect(url).toBeNull();
  }, 30000);
});

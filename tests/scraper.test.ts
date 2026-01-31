import { describe, it, expect } from "vitest";

describe("Scraper API", () => {
  it("should run scraper manually", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/scraper.run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    console.log("Scraper result:", JSON.stringify(data, null, 2));
    
    expect(data.result.data.json).toBeDefined();
    expect(data.result.data.json.success).toBe(true);
    expect(data.result.data.json.storesAdded).toBeGreaterThanOrEqual(0);
    expect(data.result.data.json.eventsAdded).toBeGreaterThanOrEqual(0);
  }, 60000); // 60秒のタイムアウト

  it("should fetch stores list after scraping", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/stores.list");
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result.data.json).toBeDefined();
    expect(Array.isArray(data.result.data.json)).toBe(true);
    
    console.log(`Total stores: ${data.result.data.json.length}`);
    
    if (data.result.data.json.length > 0) {
      const firstStore = data.result.data.json[0];
      console.log("First store:", JSON.stringify(firstStore, null, 2));
      
      expect(firstStore).toHaveProperty("id");
      expect(firstStore).toHaveProperty("name");
      expect(firstStore).toHaveProperty("address");
      expect(firstStore).toHaveProperty("latitude");
      expect(firstStore).toHaveProperty("longitude");
      expect(firstStore).toHaveProperty("events");
    }
  }, 30000);
});

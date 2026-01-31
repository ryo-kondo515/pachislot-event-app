import { describe, it, expect } from "vitest";

describe("Seed Mock Data", () => {
  it("should seed mock data successfully", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/scraper.seedMockData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result.data.json.success).toBe(true);
  }, 30000);

  it("should fetch stores list after seeding", async () => {
    const response = await fetch("http://localhost:3000/api/trpc/stores.list");
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.result.data.json).toBeDefined();
    expect(Array.isArray(data.result.data.json)).toBe(true);
    expect(data.result.data.json.length).toBeGreaterThan(0);
    
    // 店舗データの構造を確認
    const firstStore = data.result.data.json[0];
    expect(firstStore).toHaveProperty("id");
    expect(firstStore).toHaveProperty("name");
    expect(firstStore).toHaveProperty("address");
    expect(firstStore).toHaveProperty("latitude");
    expect(firstStore).toHaveProperty("longitude");
    expect(firstStore).toHaveProperty("events");
    expect(Array.isArray(firstStore.events)).toBe(true);
  }, 30000);
});

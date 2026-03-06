import { describe, it, expect } from "vitest";

describe("API Connection", () => {
  it("should connect to API server and fetch stores list", async () => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${apiBaseUrl}/api/trpc/stores.list`);
    
    expect(response.ok).toBe(true);
    
    const data = await response.json();
    expect(data).toHaveProperty("result");
    expect(data.result).toHaveProperty("data");
    expect(data.result.data).toHaveProperty("json");
    expect(Array.isArray(data.result.data.json)).toBe(true);
    
    console.log(`✓ Successfully connected to API server: ${apiBaseUrl}`);
    console.log(`✓ Retrieved ${data.result.data.json.length} stores with today's events`);
  });

  it("should verify API base URL is set correctly", () => {
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

    expect(apiBaseUrl).toBeDefined();
    expect(apiBaseUrl).toMatch(/https?:\/\/.+/);

    console.log(`✓ API base URL is correctly set: ${apiBaseUrl}`);
  });
});

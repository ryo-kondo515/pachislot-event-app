import { seedMockData } from "../server/scraper";

async function main() {
  try {
    console.log("Starting database seeding...");
    await seedMockData();
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();

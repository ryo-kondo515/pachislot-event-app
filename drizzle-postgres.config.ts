import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL_POSTGRES;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL_POSTGRES is required to run drizzle commands for PostgreSQL"
  );
}

export default defineConfig({
  schema: "./drizzle/schema-postgres.ts",
  out: "./drizzle/migrations-postgres",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
});

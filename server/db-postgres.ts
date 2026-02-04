import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { type InsertUser, users } from "../drizzle/schema-postgres";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && ENV.databaseUrlPostgres) {
    try {
      const pool = new Pool({
        connectionString: ENV.databaseUrlPostgres,
        ssl: ENV.isProduction ? { rejectUnauthorized: false } : undefined,
      });
      _db = drizzle({ client: pool });
    } catch (error) {
      console.warn("[Database] Failed to connect to PostgreSQL:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(
  user: Partial<InsertUser> & { supabaseUuid: string },
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const now = new Date();
  const values: InsertUser = {
    supabaseUuid: user.supabaseUuid,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? now,
  };

  const updateSet: Record<string, unknown> = { updatedAt: now };

  if (user.name !== undefined) updateSet.name = user.name;
  if (user.email !== undefined) updateSet.email = user.email;
  if (user.loginMethod !== undefined) updateSet.loginMethod = user.loginMethod;
  if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({
      target: users.supabaseUuid,
      set: updateSet,
    });
}

export async function getUserBySupabaseUuid(supabaseUuid: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.supabaseUuid, supabaseUuid))
    .limit(1);

  return result[0] ?? undefined;
}

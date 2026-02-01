import { events } from "../../drizzle/schema";
import { lt } from "drizzle-orm";

/**
 * データベースから過去のイベントを削除する
 */
export async function cleanupPastEvents(): Promise<{ deletedCount: number }> {
  const { getDb } = await import("../db");
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // 日本時間（JST）で当日の開始時刻を計算
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // JSTはUTC+9
  const jstNow = new Date(now.getTime() + jstOffset);
  const todayStart = new Date(Date.UTC(
    jstNow.getUTCFullYear(),
    jstNow.getUTCMonth(),
    jstNow.getUTCDate()
  ));

  console.log(`[Cleanup] Deleting events before ${todayStart.toISOString()}...`);

  // 過去のイベントを削除
  await db.delete(events).where(lt(events.eventDate, todayStart));
  
  console.log(`[Cleanup] Deleted past events`);

  return { deletedCount: 0 }; // Drizzle ORMはdeletedCountを返さないため、0を返す
}

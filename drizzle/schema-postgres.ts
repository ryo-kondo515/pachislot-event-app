import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

/**
 * Core user table backing auth flow.
 * supabaseUuid は Supabase Auth のユーザー識別子に対応。
 * openId は移行期間中の後方互換のために残す。
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  supabaseUuid: varchar("supabaseUuid", { length: 36 }).notNull().unique(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 店舗情報テーブル
 */
export const stores = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address").notNull(),
  latitude: varchar("latitude", { length: 20 }).notNull(),
  longitude: varchar("longitude", { length: 20 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  machineCount: integer("machineCount").notNull(),
  openingTime: varchar("openingTime", { length: 10 }),
  closingTime: varchar("closingTime", { length: 10 }),
  isPremium: integer("isPremium").default(0).notNull(),
  sourceUrl: text("sourceUrl"),
  officialUrl: text("officialUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Store = typeof stores.$inferSelect;
export type InsertStore = typeof stores.$inferInsert;

/**
 * 演者情報テーブル
 */
export const actors = pgTable("actors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  imageUrl: text("imageUrl"),
  rankScore: integer("rankScore").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Actor = typeof actors.$inferSelect;
export type InsertActor = typeof actors.$inferInsert;

/**
 * イベント情報テーブル
 */
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  storeId: integer("storeId").notNull(),
  actorId: integer("actorId"),
  eventDate: timestamp("eventDate", { withTimezone: true }).notNull(),
  hotLevel: integer("hotLevel").notNull(),
  machineType: varchar("machineType", { length: 255 }),
  description: text("description"),
  sourceUrl: text("sourceUrl"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

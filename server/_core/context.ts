import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema-postgres";
import { supabaseAdmin } from "./supabase";
import { getUserBySupabaseUuid, upsertUser } from "../db-postgres";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const token = extractBearerToken(opts.req);
    if (token) {
      const {
        data: { user: supabaseUser },
        error,
      } = await supabaseAdmin.auth.getUser(token);

      if (!error && supabaseUser) {
        user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;

        if (!user) {
          await upsertUser({
            supabaseUuid: supabaseUser.id,
            name: supabaseUser.user_metadata?.name || supabaseUser.email || null,
            email: supabaseUser.email || null,
            loginMethod: supabaseUser.app_metadata?.provider || null,
            lastSignedIn: new Date(),
          });
          user = await getUserBySupabaseUuid(supabaseUser.id) ?? null;
        }
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

function extractBearerToken(req: CreateExpressContextOptions["req"]): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

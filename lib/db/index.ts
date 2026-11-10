import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = ReturnType<typeof drizzle<typeof schema>>;

let cached: Database | null = null;

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * The study database, or null when DATABASE_URL is not set.
 *
 * Returning null rather than throwing lets the drug checker, which needs no
 * database at all, keep working in a deployment where study mode has not been
 * set up yet. Callers that need the database say so with a clear message.
 */
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  cached ??= drizzle(neon(url), { schema });
  return cached;
}

export { schema };

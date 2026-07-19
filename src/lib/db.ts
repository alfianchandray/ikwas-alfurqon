import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Returns the Cloudflare D1 database binding.
 * In @opennextjs/cloudflare v1+, getCloudflareContext() must be awaited.
 */
export async function getDb() {
  try {
    const context = await getCloudflareContext({ async: true });
    if (context && context.env && context.env.DB) {
      return context.env.DB;
    }
  } catch (e) {
    console.warn("getCloudflareContext failed:", e);
  }

  // Fallback for local dev using wrangler --local
  const db = (process.env as any).DB;
  if (!db) {
    throw new Error("Cloudflare D1 Database binding 'DB' was not found in environment.");
  }
  return db;
}

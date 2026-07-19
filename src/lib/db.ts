import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDb() {
  try {
    const context = getCloudflareContext();
    if (context && context.env && context.env.DB) {
      return context.env.DB;
    }
  } catch (e) {
    console.warn("getCloudflareContext failed, falling back to process.env.DB wrapper (local dev):", e);
  }

  // Fallback to process.env for other environments
  const db = (process.env as any).DB;
  if (!db) {
    throw new Error("Cloudflare D1 Database binding 'DB' was not found in environment.");
  }
  return db;
}

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";

// TEMPORARY endpoint — remove after password reset confirmed
// POST /api/reset-temp with body: { secret: "ikwas-reset-2026", password: "newpassword" }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { secret?: string; password?: string };
    if (body.secret !== "ikwas-reset-2026") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const newPassword = body.password || "ikwas2026";
    const hash = await hashPassword(newPassword);
    const db = await getDb();
    await db.prepare("UPDATE users SET password_hash = ? WHERE id = 1").bind(hash).run();
    return NextResponse.json({ success: true, message: `Password superadmin di-reset ke: ${newPassword}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

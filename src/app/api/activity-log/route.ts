import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getClientIp } from "@/lib/ip";

// Helper: validate Super Admin session
async function validateSuperAdmin(req: NextRequest, db: any) {
  const token = req.cookies.get("ikwas_session")?.value;
  if (!token) return null;

  const session = await db
    .prepare(
      `SELECT s.user_id, u.username, p.role
       FROM sessions s
       JOIN users u ON s.user_id = u.id
       JOIN pengurus p ON u.pengurus_id = p.id
       WHERE s.token = ? AND s.is_revoked = 0 AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first() as any;

  if (!session || session.role !== "Super Admin") return null;
  return session;
}

// GET: Fetch activity log (last 90 days, Super Admin only)
export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const admin = await validateSuperAdmin(req, db);

    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak. Hanya Super Admin yang dapat melihat log aktivitas." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const filterAction = searchParams.get("action") || "";
    const filterUser = searchParams.get("user") || "";
    const filterStatus = searchParams.get("status") || "";
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, user_id, username, action, target_type, target_id, detail, ip_address, status, created_at
      FROM activity_log
      WHERE created_at >= datetime('now', '-90 days')
    `;
    const params: any[] = [];

    if (filterAction) {
      query += " AND action = ?";
      params.push(filterAction);
    }
    if (filterUser) {
      query += " AND username LIKE ?";
      params.push(`%${filterUser}%`);
    }
    if (filterStatus) {
      query += " AND status = ?";
      params.push(filterStatus);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM activity_log WHERE created_at >= datetime('now', '-90 days')";
    const countParams: any[] = [];
    if (filterAction) { countQuery += " AND action = ?"; countParams.push(filterAction); }
    if (filterUser) { countQuery += " AND username LIKE ?"; countParams.push(`%${filterUser}%`); }
    if (filterStatus) { countQuery += " AND status = ?"; countParams.push(filterStatus); }

    const countResult = await db.prepare(countQuery).bind(...countParams).first() as any;
    const total = countResult?.total || 0;

    return NextResponse.json({
      logs: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/activity-log error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Cleanup logs older than 90 days (Super Admin only)
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const admin = await validateSuperAdmin(req, db);

    if (!admin) {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }

    const result = await db
      .prepare("DELETE FROM activity_log WHERE created_at < datetime('now', '-90 days')")
      .run();

    // Log the cleanup itself
    const ip = getClientIp(req);
    await db.prepare(
      "INSERT INTO activity_log (user_id, username, action, target_type, detail, ip_address, status) VALUES (?, ?, 'CLEANUP_LOG', 'activity_log', ?, ?, 'success')"
    ).bind(admin.user_id, admin.username, JSON.stringify({ note: "manual cleanup triggered" }), ip).run();

    return NextResponse.json({ success: true, message: "Log lama berhasil dibersihkan." });
  } catch (error: any) {
    console.error("DELETE /api/activity-log error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

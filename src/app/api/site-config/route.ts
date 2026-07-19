import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = getDb();
    const config = await db
      .prepare("SELECT * FROM site_config WHERE id = 1")
      .first();

    if (!config) {
      return NextResponse.json(
        {
          site_name: "IKWAS Al-Furqon",
          site_desc: "Sistem manajemen keuangan terpadu Ikatan Keluarga Santri dengan amanah dan transparan.",
          theme_color: "teal",
          logo_type: "medallion",
          favicon_url: "",
          logo_url: ""
        },
        { status: 200 }
      );
    }
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("GET site-config error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json() as { siteName?: string; siteDesc?: string; themeColor?: string; logoType?: string; faviconUrl?: string; logoUrl?: string };
    const { siteName, siteDesc, themeColor, logoType, faviconUrl, logoUrl } = body;

    if (!siteName || !siteDesc) {
      return NextResponse.json({ error: "Nama dan Deskripsi wajib diisi!" }, { status: 400 });
    }

    await db
      .prepare(
        "UPDATE site_config SET site_name = ?, site_desc = ?, theme_color = ?, logo_type = ?, favicon_url = ?, logo_url = ? WHERE id = 1"
      )
      .bind(siteName, siteDesc, themeColor || "teal", logoType || "medallion", faviconUrl || "", logoUrl || "")
      .run();

    return NextResponse.json({ success: true, message: "Pengaturan situs berhasil disimpan." });
  } catch (error: any) {
    console.error("POST site-config error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

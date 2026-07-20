import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const { results } = await db
      .prepare("SELECT keterangan FROM transaksi WHERE tipe = 'out' AND keterangan LIKE 'Penerima: %'")
      .all();
    
    const recipients = new Set<string>();
    if (Array.isArray(results)) {
      results.forEach((row: Record<string, unknown>) => {
        const ket = (row.keterangan as string) || "";
        if (ket.startsWith("Penerima: ")) {
          const parts = ket.substring(10).split(" - ");
          if (parts[0]) {
            recipients.add(parts[0].trim());
          }
        }
      });
    }
    
    return NextResponse.json(Array.from(recipients));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error("GET /api/transaksi/penerima error:", error);
    return NextResponse.json([], { status: 500 });
  }
}

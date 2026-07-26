import { NextResponse } from "next/server";
import { ensureSchema, pool } from "@/db";

export async function GET() {
  try {
    await ensureSchema();
    await pool.query("SELECT 1");
    return NextResponse.json({ ok: true, service: "messaggi" });
  } catch {
    return NextResponse.json({ ok: false, service: "messaggi" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import * as fs from "fs";

export const dynamic = "force-dynamic";

const HISTORY_FILE = "/Users/alfredpifi/clawd/cost-history.json";

export async function GET() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return NextResponse.json({ daily: {} });
    }
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ daily: {} });
  }
}

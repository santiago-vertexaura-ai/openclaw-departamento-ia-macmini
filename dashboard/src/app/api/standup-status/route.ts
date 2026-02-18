import { NextResponse } from "next/server";
import * as fs from "fs";

export const dynamic = "force-dynamic";

const STANDUP_FILE = process.env.HOME
  ? `${process.env.HOME}/clawd/standup-active.json`
  : "/Users/alfredpifi/clawd/standup-active.json";

export async function GET() {
  try {
    if (!fs.existsSync(STANDUP_FILE)) {
      return NextResponse.json({ active: false });
    }
    const raw = fs.readFileSync(STANDUP_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ active: false });
  }
}

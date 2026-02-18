import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const CRON_FILE = path.join(
  process.env.HOME || "/Users/alfredpifi",
  ".openclaw",
  "cron",
  "jobs.json"
);

export async function GET() {
  try {
    if (!fs.existsSync(CRON_FILE)) {
      return NextResponse.json({ version: 1, jobs: [] });
    }
    const content = fs.readFileSync(CRON_FILE, "utf-8");
    const data = JSON.parse(content);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to read cron jobs" },
      { status: 500 }
    );
  }
}

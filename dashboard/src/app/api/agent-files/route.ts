import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

const HOME = process.env.HOME || "/Users/alfredpifi";

const WORKSPACES: Record<string, string> = {
  alfred: path.join(HOME, "clawd"),
  roberto: path.join(HOME, "clawd", "workspace-roberto"),
  andres: path.join(HOME, "clawd", "workspace-andres"),
  marina: path.join(HOME, "clawd", "workspace-marina"),
  arturo: path.join(HOME, "clawd", "workspace-arturo"),
  alex: path.join(HOME, "clawd", "workspace-alex"),
};

const ALLOWED_FILES = [
  "SOUL.md",
  "AGENTS.md",
  "TOOLS.md",
  "MEMORY.md",
  "USER.md",
  "IDENTITY.md",
  "HEARTBEAT.md",
];

function isAllowed(filename: string): boolean {
  return ALLOWED_FILES.includes(filename);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent") || "alfred";
  const file = searchParams.get("file");

  if (!file || !isAllowed(file)) {
    return NextResponse.json(
      { error: "Invalid or disallowed file", allowed: ALLOWED_FILES },
      { status: 400 }
    );
  }

  const workspace = WORKSPACES[agent];
  if (!workspace) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const filePath = path.join(workspace, file);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ content: "", exists: false });
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return NextResponse.json({ content, exists: true });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { agent = "alfred", file, content } = body;

  if (!file || !isAllowed(file)) {
    return NextResponse.json(
      { error: "Invalid or disallowed file", allowed: ALLOWED_FILES },
      { status: 400 }
    );
  }

  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 });
  }

  const workspace = WORKSPACES[agent];
  if (!workspace) {
    return NextResponse.json({ error: "Unknown agent" }, { status: 400 });
  }

  const filePath = path.join(workspace, file);

  try {
    fs.writeFileSync(filePath, content, "utf-8");
    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to write file: ${err}` },
      { status: 500 }
    );
  }
}

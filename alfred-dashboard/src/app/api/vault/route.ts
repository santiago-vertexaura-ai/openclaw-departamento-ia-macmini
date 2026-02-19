import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

const VAULT_SCRIPT = "/Users/alfredpifi/clawd/scripts/vault.sh";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity") || "";
    const hops = searchParams.get("hops") || "3";

    let cmd = `${VAULT_SCRIPT} graph`;
    if (entity) {
      cmd += ` --entity "${entity}" --hops ${hops}`;
    }

    const output = execSync(cmd, {
      encoding: "utf-8",
      timeout: 10000,
      env: { ...process.env, HOME: "/Users/alfredpifi" },
    });

    const data = JSON.parse(output);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Vault API error:", error);
    return NextResponse.json(
      { nodes: [], edges: [], stats: { total_notes: 0, total_links: 0, categories: {} } },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "add") {
      const { category, title, content, tags, type, priority, author } = body;
      let cmd = `${VAULT_SCRIPT} add "${category}" "${title}"`;
      if (content) cmd += ` "${content.replace(/"/g, '\\"')}"`;
      if (tags) cmd += ` --tags "${tags}"`;
      if (type) cmd += ` --type "${type}"`;
      if (priority) cmd += ` --priority "${priority}"`;
      if (author) cmd += ` --author "${author}"`;

      const output = execSync(cmd, {
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, HOME: "/Users/alfredpifi" },
      });
      return NextResponse.json(JSON.parse(output));
    }

    if (action === "read") {
      const { slug } = body;
      const output = execSync(`${VAULT_SCRIPT} read "${slug}"`, {
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, HOME: "/Users/alfredpifi" },
      });
      return NextResponse.json({ content: output });
    }

    if (action === "search") {
      const { query } = body;
      const output = execSync(`${VAULT_SCRIPT} search "${query}"`, {
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, HOME: "/Users/alfredpifi" },
      });
      return NextResponse.json(JSON.parse(output));
    }

    if (action === "stats") {
      const output = execSync(`${VAULT_SCRIPT} stats`, {
        encoding: "utf-8",
        timeout: 5000,
        env: { ...process.env, HOME: "/Users/alfredpifi" },
      });
      return NextResponse.json(JSON.parse(output));
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Vault POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

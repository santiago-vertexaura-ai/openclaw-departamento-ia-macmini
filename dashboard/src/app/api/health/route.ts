import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  name: string;
  status: "ok" | "error";
  latencyMs?: number;
}

async function checkService(name: string, url: string, timeoutMs = 3000): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return {
      name,
      status: res.ok || res.status < 500 ? "ok" : "error",
      latencyMs: Date.now() - start,
    };
  } catch {
    return { name, status: "error", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkService("Gateway", "http://127.0.0.1:18789/"),
    checkService(
      "Supabase",
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      5000
    ),
    checkService("TTS", "http://127.0.0.1:5050/v1/models"),
    checkService("Ollama", "http://127.0.0.1:11434/api/tags"),
  ]);

  return NextResponse.json(checks);
}

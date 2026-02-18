import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const GATEWAY_URL = "http://127.0.0.1:18789/v1/chat/completions";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN || "";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const messages = body.messages || [];

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
        "x-openclaw-agent-id": "main",
      },
      body: JSON.stringify({
        model: "openclaw",
        stream: true,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stream the SSE response back to the client
    const readable = response.body;
    if (!readable) {
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Gateway connection failed: ${err}` }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

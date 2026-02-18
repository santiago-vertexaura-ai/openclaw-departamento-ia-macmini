import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MONITORED_ACCOUNTS = ["santim.ia", "racklabs", "mattganzak"];

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("agent_docs")
      .select("id,title,author,doc_type,tags,word_count,created_at")
      .in("doc_type", ["research", "report", "analysis", "instagram_analysis"])
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return all docs, marking those from monitored accounts
    const enriched = (data || []).map((doc) => ({
      ...doc,
      monitoredAccount: doc.tags?.find((t: string) =>
        MONITORED_ACCOUNTS.some((a) => t.toLowerCase().includes(a))
      ) || null,
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("Social feed error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

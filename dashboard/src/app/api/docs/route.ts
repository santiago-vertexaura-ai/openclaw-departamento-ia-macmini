import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

// Service role bypasses RLS — agent_docs has RLS enabled without policies
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("id");
  const docType = searchParams.get("doc_type");
  const search = searchParams.get("search");

  // Single doc with full content (on-demand when user clicks)
  if (docId) {
    const { data, error } = await supabase
      .from("agent_docs")
      .select("*")
      .eq("id", docId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // List: exclude heavy `content` field to minimize egress
  // Try with review columns first, fallback without them if migration not run yet
  const SELECT_WITH_REVIEW = "id,title,author,doc_type,word_count,tags,rating,comments,review_status,review_feedback,created_at";
  const SELECT_WITHOUT_REVIEW = "id,title,author,doc_type,word_count,tags,rating,comments,created_at";

  let selectFields = SELECT_WITH_REVIEW;
  const reviewStatus = searchParams.get("review_status");

  const runQuery = async (fields: string) => {
    let q = supabase
      .from("agent_docs")
      .select(fields)
      .order("created_at", { ascending: false });
    if (docType) q = q.eq("doc_type", docType);
    if (reviewStatus && fields.includes("review_status")) q = q.eq("review_status", reviewStatus);
    if (search) q = q.ilike("title", `%${search}%`);
    return q;
  };

  let { data, error } = await runQuery(selectFields);

  // Fallback: if review columns don't exist yet, retry without them
  if (error && error.message.includes("review_status")) {
    selectFields = SELECT_WITHOUT_REVIEW;
    ({ data, error } = await runQuery(selectFields));
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const content = body.content || "";

  const { data, error } = await supabase
    .from("agent_docs")
    .insert({
      title: body.title,
      content,
      author: body.author || "Roberto",
      doc_type: body.doc_type || "research",
      tags: body.tags || [],
      task_id: body.task_id || null,
      word_count: content.split(/\s+/).filter(Boolean).length,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (updates.content) {
    updates.word_count = updates.content.split(/\s+/).filter(Boolean).length;
  }

  const { data, error } = await supabase
    .from("agent_docs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync rating → vault confidence (best-effort)
  if (updates.rating !== undefined && data?.title) {
    const ratingToConf: Record<number, number> = {
      1: 0.3, 2: 0.5, 3: 0.7, 4: 0.85, 5: 1.0,
    };
    const conf = ratingToConf[Math.round(updates.rating)] || 0.7;
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00fc -]/g, "")
      .replace(/[\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    try {
      execSync(
        `/Users/alfredpifi/clawd/scripts/vault.sh update-confidence "${slug}" "${conf}"`,
        { timeout: 3000, encoding: "utf-8" }
      );
    } catch {
      // Vault update is best-effort — note may not exist yet
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("agent_docs").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

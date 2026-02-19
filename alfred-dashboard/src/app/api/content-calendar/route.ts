import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("content_calendar")
      .select("*")
      .order("suggested_time", { ascending: true, nullsFirst: false });

    if (status) query = query.eq("status", status);
    if (platform) query = query.eq("platform", platform);
    if (from) query = query.gte("suggested_time", from);
    if (to) query = query.lte("suggested_time", to);

    const { data, error } = await query.limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, platform, suggested_time, hook, hashtags, visual_brief, formula_ref, task_id, doc_id, created_by } = body;

    if (!content || !platform) {
      return NextResponse.json({ error: "content and platform are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("content_calendar")
      .insert({
        content,
        platform,
        suggested_time: suggested_time || null,
        hook: hook || null,
        hashtags: hashtags || null,
        visual_brief: visual_brief || null,
        formula_ref: formula_ref || null,
        task_id: task_id || null,
        doc_id: doc_id || null,
        created_by: created_by || "marina",
        status: "pending_review",
        version: 1,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create calendar entry" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, feedback } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (feedback) updates.feedback = feedback;

    // If revision, increment version
    if (status === "revision") {
      const { data: current } = await supabase
        .from("content_calendar")
        .select("version,task_id,content,platform")
        .eq("id", id)
        .single();

      if (current) {
        updates.version = (current.version || 1) + 1;

        // Auto-create Marina revision task
        if (feedback) {
          await supabase.from("agent_tasks").insert({
            title: `Revision: ${current.content?.slice(0, 50)}...`,
            assigned_to: "marina",
            task_type: "content_revision",
            status: "pendiente",
            priority: "alta",
            brief: JSON.stringify({
              calendar_id: id,
              platform: current.platform,
              feedback,
              original_content: current.content,
            }),
            created_by: "dashboard",
          });
        }
      }
    }

    const { data, error } = await supabase
      .from("content_calendar")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to update calendar entry" }, { status: 500 });
  }
}

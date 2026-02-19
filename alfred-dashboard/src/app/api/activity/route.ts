import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const agent = searchParams.get("agent");

  let query = supabase
    .from("agent_activity")
    .select("id,agent_id,action,task_id,details,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (agent) {
    query = query.eq("agent_id", agent);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activities = data || [];

  // Fetch task titles for entries that have task_id
  const taskIds = [...new Set(activities.map((a) => a.task_id).filter(Boolean))];
  let titleMap: Record<string, string> = {};

  if (taskIds.length > 0) {
    const { data: tasks } = await supabase
      .from("agent_tasks")
      .select("id,title")
      .in("id", taskIds);
    titleMap = Object.fromEntries((tasks || []).map((t) => [t.id, t.title]));
  }

  const result = activities.map((a) => ({
    ...a,
    task_title: a.task_id ? titleMap[a.task_id] || null : null,
  }));

  return NextResponse.json(result);
}

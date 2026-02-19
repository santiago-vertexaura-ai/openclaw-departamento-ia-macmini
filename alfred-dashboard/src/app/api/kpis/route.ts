import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [tasksCount, docsCount, ratings] = await Promise.all([
      supabase
        .from("agent_tasks")
        .select("*", { count: "exact", head: true })
        .eq("status", "completada")
        .gte("updated_at", weekStart.toISOString()),

      supabase
        .from("agent_docs")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString()),

      supabase
        .from("agent_docs")
        .select("rating")
        .not("rating", "is", null)
        .gt("rating", 0),
    ]);

    let avgRating: number | null = null;
    if (ratings.data && ratings.data.length > 0) {
      const sum = ratings.data.reduce((acc, d) => acc + (d.rating || 0), 0);
      avgRating = sum / ratings.data.length;
    }

    return NextResponse.json({
      tasksCompletedWeek: tasksCount.count ?? 0,
      docsCreatedWeek: docsCount.count ?? 0,
      avgRating,
    });
  } catch {
    return NextResponse.json(
      { tasksCompletedWeek: 0, docsCreatedWeek: 0, avgRating: null },
      { status: 500 }
    );
  }
}

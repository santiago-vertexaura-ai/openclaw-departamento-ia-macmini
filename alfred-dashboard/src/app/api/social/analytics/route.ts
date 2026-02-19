import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCalendar = searchParams.get("include_calendar") === "true";

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    // Get draft docs for analytics
    const { data: drafts } = await supabase
      .from("agent_docs")
      .select("id,title,doc_type,tags,rating,review_status,scheduled_date,created_at")
      .eq("doc_type", "draft")
      .order("created_at", { ascending: false })
      .limit(100);

    const allDrafts = drafts || [];
    const weekDrafts = allDrafts.filter((d) => new Date(d.created_at) >= weekAgo);
    const monthDrafts = allDrafts.filter((d) => new Date(d.created_at) >= monthAgo);
    const approved = allDrafts.filter((d) => d.review_status === "approved");
    const pending = allDrafts.filter((d) => d.review_status === "pending_review");
    const rated = allDrafts.filter((d) => d.rating != null);

    // Platform counts from tags
    const platformCounts: Record<string, number> = {};
    for (const draft of monthDrafts) {
      for (const tag of draft.tags || []) {
        const t = tag.toLowerCase();
        if (["linkedin", "twitter", "instagram", "x"].includes(t)) {
          const key = t === "x" ? "twitter" : t;
          platformCounts[key] = (platformCounts[key] || 0) + 1;
        }
      }
    }

    const result: Record<string, unknown> = {
      draftsThisWeek: weekDrafts.length,
      draftsThisMonth: monthDrafts.length,
      approvalRate: allDrafts.length > 0 ? (approved.length / allDrafts.length) * 100 : 0,
      avgRating: rated.length > 0 ? rated.reduce((s, d) => s + (d.rating || 0), 0) / rated.length : null,
      platformCounts,
      pendingReviews: pending.length,
    };

    if (includeCalendar) {
      result.calendarItems = approved.filter((d) => d.scheduled_date).map((d) => ({
        id: d.id,
        title: d.title,
        scheduled_date: d.scheduled_date,
        tags: d.tags,
        review_status: d.review_status,
      }));
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Social analytics error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

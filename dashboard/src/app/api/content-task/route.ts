import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { doc_id, platforms, notes } = body;

    if (!doc_id) {
      return NextResponse.json({ error: "doc_id is required" }, { status: 400 });
    }

    // Fetch the source doc
    const { data: doc, error: docError } = await supabase
      .from("agent_docs")
      .select("id,title,doc_type")
      .eq("id", doc_id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check if a Marina task already exists for this doc
    const { data: existing } = await supabase
      .from("agent_tasks")
      .select("id")
      .eq("assigned_to", "marina")
      .eq("status", "pendiente")
      .contains("brief", { source_doc_id: doc_id })
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: "Ya existe una tarea pendiente para este documento" }, { status: 409 });
    }

    // Build task
    const comments = notes ? [{ author: "Santi", text: notes, timestamp: new Date().toISOString() }] : [];

    const { data: task, error: taskError } = await supabase
      .from("agent_tasks")
      .insert({
        title: `Crear contenido: ${doc.title}`,
        assigned_to: "marina",
        task_type: "content_creation",
        status: "pendiente",
        priority: "media",
        brief: {
          source_doc_id: doc_id,
          source_doc_type: doc.doc_type,
          platforms: platforms || ["linkedin", "twitter", "instagram"],
        },
        comments,
        created_by: "santi",
      })
      .select("id")
      .single();

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    // Log activity
    await supabase.from("agent_activity").insert({
      agent_id: "marina",
      action: "content_task_created",
      task_id: task?.id,
      details: { doc_id, doc_title: doc.title, platforms },
    });

    return NextResponse.json({ success: true, task_id: task?.id }, { status: 201 });
  } catch (err) {
    console.error("Content task error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

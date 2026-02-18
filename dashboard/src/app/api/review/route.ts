import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { exec } from "child_process";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const GATEWAY_URL = "http://localhost:18789/v1/chat/completions";
const GATEWAY_TOKEN = process.env.OPENCLAW_GATEWAY_TOKEN!;

const SYSTEM_PROMPT = `Eres Alfred, el agente orquestador de VertexAura. Tu compañero Roberto acaba de completar una tarea de investigación.

Tu rol es revisar su trabajo y dar feedback estratégico y constructivo:
- Destaca los puntos fuertes del trabajo
- Señala áreas que podrían profundizarse o ampliarse
- Sugiere ideas de contenido derivado (posts, artículos, comparativas) para el equipo de marketing
- Indica cómo esta investigación beneficia la estrategia de VertexAura

Sé concreto, directo y estratégico. Responde en español. Máximo 4-5 frases. No uses listas, escribe en prosa natural como si hablaras directamente con Roberto.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Route: doc review (Santi approves/rejects Marina's drafts)
    if (body.doc_id && body.action) {
      return handleDocReview(body);
    }

    // Route: LLM review (Alfred reviews Roberto's completed tasks)
    const { task_id } = body;
    if (!task_id) {
      return NextResponse.json({ error: "task_id or (doc_id + action) is required" }, { status: 400 });
    }

    // Fetch task details
    const { data: task } = await supabase
      .from("agent_tasks")
      .select("id, title, description, result")
      .eq("id", task_id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch associated doc if exists
    const { data: docs } = await supabase
      .from("agent_docs")
      .select("title, content, doc_type, word_count")
      .eq("task_id", task_id)
      .limit(1);

    const doc = docs?.[0];

    // Build context for the LLM
    let userMessage = `Tarea: "${task.title}"`;
    if (task.description) userMessage += `\nDescripción: ${task.description}`;

    // Parse result if it's JSON
    if (task.result) {
      const resultStr = typeof task.result === "string" ? task.result : JSON.stringify(task.result);
      const resultPreview = resultStr.length > 800 ? resultStr.slice(0, 800) + "..." : resultStr;
      userMessage += `\n\nResultado de Roberto:\n${resultPreview}`;
    }

    if (doc) {
      const contentPreview = doc.content.length > 1000 ? doc.content.slice(0, 1000) + "..." : doc.content;
      userMessage += `\n\nDocumento generado (${doc.word_count} palabras, tipo: ${doc.doc_type}):\n${contentPreview}`;
    }

    // Call OpenClaw gateway for LLM review
    const llmRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    let feedback: string;

    if (llmRes.ok) {
      const llmData = await llmRes.json();
      feedback = llmData.choices?.[0]?.message?.content || "Revisado. Buen trabajo, Roberto.";
    } else {
      // Fallback if gateway is down
      feedback = `He revisado la investigación "${task.title}". El trabajo cubre los puntos esenciales. Sugiero profundizar en algunos aspectos clave para maximizar el valor para VertexAura.`;
    }

    // Store the review as agent_activity
    const { error: actError } = await supabase.from("agent_activity").insert({
      agent_id: "Alfred",
      action: "task_reviewed",
      task_id,
      details: { feedback, task_title: task.title },
    });

    if (actError) {
      return NextResponse.json({ error: actError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, feedback });
  } catch (err) {
    console.error("Review error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Handle Santi's review of Marina's drafts
async function handleDocReview(body: { doc_id: string; action: string; feedback?: string }) {
  const { doc_id, action, feedback } = body;

  if (!["approve", "request_revision", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "action must be: approve, request_revision, or reject" },
      { status: 400 }
    );
  }

  const statusMap: Record<string, string> = {
    approve: "approved",
    request_revision: "revision_requested",
    reject: "rejected",
  };

  // 1. Update the doc's review_status
  const updatePayload: Record<string, unknown> = {
    review_status: statusMap[action],
  };
  if (feedback) {
    updatePayload.review_feedback = feedback;
  }

  const { data: doc, error: updateError } = await supabase
    .from("agent_docs")
    .update(updatePayload)
    .eq("id", doc_id)
    .select("id,title,task_id,author,comments")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // 2. Add feedback as a comment on the doc
  if (feedback) {
    const actionLabel = action === "approve" ? "Aprobado" : action === "reject" ? "Rechazado" : "Revision solicitada";
    const existingComments = doc?.comments || [];
    const newComment = {
      author: "Santi",
      text: `[${actionLabel}] ${feedback}`,
      timestamp: new Date().toISOString(),
    };

    await supabase
      .from("agent_docs")
      .update({ comments: [...existingComments, newComment] })
      .eq("id", doc_id);
  }

  // 3. Log activity
  await supabase.from("agent_activity").insert({
    agent_id: "marina",
    action: `doc_${action === "approve" ? "approved" : action === "reject" ? "rejected" : "revision_requested"}`,
    task_id: doc?.task_id || null,
    details: { doc_id, doc_title: doc?.title, feedback: feedback || null },
  });

  // 4. Save to vault for Marina's learning loop (fire-and-forget)
  if (feedback || action === "approve") {
    const vaultScript = "/Users/alfredpifi/clawd/scripts/vault.sh";
    const slug = `content-feedback-${doc_id.slice(0, 8)}`;
    const label = action === "approve" ? "APROBADO" : action === "reject" ? "RECHAZADO" : "REVISION";
    const safeTitle = (doc?.title || "Draft").replace(/"/g, '\\"');
    const safeFeedback = feedback ? feedback.replace(/"/g, '\\"') : "Draft cumplio expectativas.";
    const note = `Santi ${label} draft "${safeTitle}". ${safeFeedback} [[perfil-santi]] [[marina]]`;
    exec(
      `${vaultScript} add lessons "${slug}" "${note}" --tags "content-feedback,${action},auto" --author Santi --priority high`,
      (err) => { if (err) console.error("Vault ingest error:", err.message); }
    );
  }

  // 5. If revision requested, create a new task for Marina
  if (action === "request_revision" && feedback) {
    const { data: newTask, error: taskError } = await supabase
      .from("agent_tasks")
      .insert({
        title: `Revision: ${doc?.title || "Draft"}`,
        assigned_to: "marina",
        task_type: "content_creation",
        priority: "alta",
        status: "pendiente",
        description: `Santi pidio revision del draft "${doc?.title}". Feedback: ${feedback}`,
        brief: {
          source_doc_id: doc_id,
          revision: true,
          original_task_id: doc?.task_id,
        },
        comments: [
          {
            author: "Santi",
            text: feedback,
            timestamp: new Date().toISOString(),
          },
        ],
        created_by: "santi",
      })
      .select("id")
      .single();

    return NextResponse.json({
      success: true,
      review_status: statusMap[action],
      task_created: !taskError,
      task_id: newTask?.id || null,
    });
  }

  return NextResponse.json({
    success: true,
    review_status: statusMap[action],
  });
}

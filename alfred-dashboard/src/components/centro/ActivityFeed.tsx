"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, AlertTriangle, Users } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { useDocumentVisible } from "@/hooks/useVisibility";

interface ActivityEntry {
  id: string;
  agent_id: string;
  action: string;
  task_id?: string;
  task_title?: string;
  details?: Record<string, unknown> | string | null;
  created_at: string;
}

type AgentFilter = "all" | "alfred" | "roberto" | "andres" | "marina" | "arturo" | "alex";

const AGENT_STYLES: Record<string, { text: string; mention: string; avatar: string }> = {
  Alfred: {
    text: "text-blue-400",
    mention: "text-blue-400 font-semibold",
    avatar: "bg-blue-500/15 text-blue-400",
  },
  alfred: {
    text: "text-blue-400",
    mention: "text-blue-400 font-semibold",
    avatar: "bg-blue-500/15 text-blue-400",
  },
  Roberto: {
    text: "text-purple-400",
    mention: "text-purple-400 font-semibold",
    avatar: "bg-purple-500/15 text-purple-400",
  },
  roberto: {
    text: "text-purple-400",
    mention: "text-purple-400 font-semibold",
    avatar: "bg-purple-500/15 text-purple-400",
  },
  "Andrés": {
    text: "text-amber-400",
    mention: "text-amber-400 font-semibold",
    avatar: "bg-amber-500/15 text-amber-400",
  },
  andres: {
    text: "text-amber-400",
    mention: "text-amber-400 font-semibold",
    avatar: "bg-amber-500/15 text-amber-400",
  },
  Marina: {
    text: "text-pink-400",
    mention: "text-pink-400 font-semibold",
    avatar: "bg-pink-500/15 text-pink-400",
  },
  marina: {
    text: "text-pink-400",
    mention: "text-pink-400 font-semibold",
    avatar: "bg-pink-500/15 text-pink-400",
  },
  Arturo: {
    text: "text-yellow-400",
    mention: "text-yellow-400 font-semibold",
    avatar: "bg-yellow-500/15 text-yellow-400",
  },
  arturo: {
    text: "text-yellow-400",
    mention: "text-yellow-400 font-semibold",
    avatar: "bg-yellow-500/15 text-yellow-400",
  },
  Alex: {
    text: "text-red-400",
    mention: "text-red-400 font-semibold",
    avatar: "bg-red-500/15 text-red-400",
  },
  alex: {
    text: "text-red-400",
    mention: "text-red-400 font-semibold",
    avatar: "bg-red-500/15 text-red-400",
  },
};

function getStyle(agentId: string) {
  return AGENT_STYLES[agentId] || {
    text: "text-zinc-400",
    mention: "text-zinc-400 font-semibold",
    avatar: "bg-zinc-500/15 text-zinc-400",
  };
}

interface Thread {
  id: string;
  taskTitle: string | null;
  parentTime: string;
  replies: ThreadReply[];
}

interface ThreadReply {
  id: string;
  agent_id: string;
  text: string;
  isError: boolean;
  detail?: string;
  created_at: string;
}

interface StandaloneMsg {
  id: string;
  text: string;
  created_at: string;
}

interface StandupSummary {
  id: string;
  title: string;
  summary: string;
  agents_involved: string[];
  created_at: string;
  expanded?: boolean;
}

interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  agent_id: string;
  created_at: string;
}

type FeedItem =
  | { type: "thread"; data: Thread }
  | { type: "standalone"; data: StandaloneMsg }
  | { type: "standup"; data: StandupSummary }
  | { type: "anomaly"; data: AnomalyAlert };

function buildFeed(entries: ActivityEntry[]): FeedItem[] {
  const taskGroups = new Map<string, ActivityEntry[]>();
  const standalone: ActivityEntry[] = [];
  const sorted = [...entries].reverse();

  for (const entry of sorted) {
    if (entry.task_id) {
      if (!taskGroups.has(entry.task_id)) {
        taskGroups.set(entry.task_id, []);
      }
      taskGroups.get(entry.task_id)!.push(entry);
    } else {
      standalone.push(entry);
    }
  }

  const items: FeedItem[] = [];

  for (const [taskId, group] of taskGroups) {
    const title = group.find((e) => e.task_title)?.task_title || null;
    const replies: ThreadReply[] = [];

    for (const entry of group) {
      const d = typeof entry.details === "object" && entry.details ? entry.details : null;

      // Use LLM-generated message from details.message if available, otherwise fallback to templates
      const llmMessage = typeof d?.message === "string" && d.message.length > 0 ? d.message : null;

      if (entry.action === "task_started") {
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || "@Alfred, recibido. Me pongo con ello.",
          isError: false,
          created_at: entry.created_at,
        });
      } else if (entry.action === "task_completed") {
        const resumen = d?.resumen || d?.summary || d?.resultado || "";
        const preview = typeof resumen === "string" && resumen.length > 140
          ? resumen.slice(0, 140) + "..." : String(resumen);
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || "@Alfred, tarea finalizada.",
          isError: false,
          detail: preview || undefined,
          created_at: entry.created_at,
        });
      } else if (entry.action === "task_failed") {
        const errorMsg = d?.error || d?.message || "";
        const preview = typeof errorMsg === "string" && errorMsg.length > 120
          ? errorMsg.slice(0, 120) + "..." : String(errorMsg);
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || "@Alfred, he tenido un problema con esta tarea.",
          isError: true,
          detail: preview || undefined,
          created_at: entry.created_at,
        });
      } else if (entry.action === "doc_created") {
        const wordCount = d?.word_count || 0;
        const docType = d?.doc_type || "investigación";
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || `@Alfred, documento de ${docType} generado${wordCount ? ` (${wordCount} palabras)` : ""}.`,
          isError: false,
          created_at: entry.created_at,
        });
      } else if (entry.action === "task_reviewed") {
        const feedback = d?.feedback || "";
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || (typeof feedback === "string" && feedback.length > 0
            ? feedback
            : "He revisado la investigación. Buen trabajo."),
          isError: false,
          created_at: entry.created_at,
        });
      } else if (entry.action === "task_handoff") {
        replies.push({
          id: entry.id,
          agent_id: entry.agent_id,
          text: llmMessage || "@Andrés, ya terminé mi parte. Te toca.",
          isError: false,
          created_at: entry.created_at,
        });
      } else if (entry.action === "task_created") {
        // Already handled as thread parent — skip to avoid duplication
      }
    }

    // Deduplicate consecutive "recibido" messages (from retries after reset_stale)
    const dedupedReplies: ThreadReply[] = [];
    for (const r of replies) {
      const prev = dedupedReplies[dedupedReplies.length - 1];
      if (prev && prev.text === r.text && r.text.includes("recibido")) continue;
      dedupedReplies.push(r);
    }

    if (dedupedReplies.length > 0) {
      items.push({
        type: "thread",
        data: {
          id: taskId,
          taskTitle: title,
          parentTime: group[0].created_at,
          replies: dedupedReplies,
        },
      });
    }
  }

  for (const entry of standalone) {
    const d = typeof entry.details === "object" && entry.details ? entry.details : null;
    if (entry.action.includes("reset_stale")) {
      const elapsed = d?.elapsed_seconds;
      const mins = elapsed ? Math.round(Number(elapsed) / 60) : 0;
      items.push({
        type: "standalone",
        data: {
          id: entry.id,
          text: `Tarea estancada detectada${mins ? ` (${mins} min)` : ""}. Reseteando...`,
          created_at: entry.created_at,
        },
      });
    } else if (entry.action === "standup_summary") {
      const summary = typeof d?.summary === "string" ? d.summary : "";
      const agents = Array.isArray(d?.agents_involved) ? d.agents_involved as string[] : [];
      items.push({
        type: "standup",
        data: {
          id: entry.id,
          title: typeof d?.title === "string" ? d.title : "Standup",
          summary,
          agents_involved: agents,
          created_at: entry.created_at,
        },
      });
    } else if (entry.action === "anomaly_detected") {
      items.push({
        type: "anomaly",
        data: {
          id: entry.id,
          title: typeof d?.title === "string" ? d.title : "Anomalía detectada",
          description: typeof d?.description === "string" ? d.description : "",
          agent_id: entry.agent_id,
          created_at: entry.created_at,
        },
      });
    }
  }

  items.sort((a, b) => {
    const timeA = a.type === "thread" ? a.data.parentTime : a.data.created_at;
    const timeB = b.type === "thread" ? b.data.parentTime : b.data.created_at;
    return new Date(timeA).getTime() - new Date(timeB).getTime();
  });

  return items;
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function MentionText({ text }: { text: string }) {
  return (
    <span>
      {text.split(/(@[\w\u00C0-\u024F]+)/g).map((part, i) => {
        if (part.startsWith("@")) {
          const name = part.slice(1);
          const style = AGENT_STYLES[name]?.mention || "text-zinc-400 font-semibold";
          return <span key={i} className={style}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AgentFilter>("all");
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const { addToast } = useToast();
  const visible = useDocumentVisible();

  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/activity?limit=20&t=${Date.now()}`);
        if (res.ok) {
          const data: ActivityEntry[] = await res.json();
          setEntries(data);

          // Fire toasts for new events (skip initial load)
          if (!initialLoadRef.current) {
            for (const entry of data) {
              if (seenIdsRef.current.has(entry.id)) continue;
              const d = typeof entry.details === "object" && entry.details ? entry.details : null;
              if (entry.action === "task_completed") {
                addToast({
                  type: "success",
                  title: "Tarea completada",
                  message: entry.task_title || entry.agent_id,
                });
              } else if (entry.action === "task_failed") {
                addToast({
                  type: "error",
                  title: "Tarea fallida",
                  message: entry.task_title || entry.agent_id,
                  duration: 8000,
                });
              } else if (entry.action === "doc_created") {
                const docType = typeof d?.doc_type === "string" ? d.doc_type : "";
                addToast({
                  type: "info",
                  title: docType === "draft" ? "Contenido listo para review" : "Documento creado",
                  message: `${entry.agent_id}: ${entry.task_title || "nuevo doc"}`,
                  navigateTo: docType === "draft" ? { tab: "social" } : undefined,
                });
              } else if (entry.action === "standup_summary") {
                addToast({
                  type: "info",
                  title: "Standup completado",
                  message: typeof d?.title === "string" ? d.title : "Resumen disponible",
                  navigateTo: { tab: "centro" },
                });
              } else if (entry.action === "anomaly_detected") {
                addToast({
                  type: "warning",
                  title: "Anomalía detectada",
                  message: typeof d?.title === "string" ? d.title : entry.agent_id,
                  duration: 10000,
                  navigateTo: { tab: "social" },
                });
              }
            }
          }
          initialLoadRef.current = false;
          seenIdsRef.current = new Set(data.map(e => e.id));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [addToast, visible]);

  const feed = buildFeed(entries);
  const filtered = filter === "all"
    ? feed
    : feed.filter((item) => {
        if (item.type === "standalone") return false;
        if (item.type === "standup") return true; // standups involve all agents
        if (item.type === "anomaly") return item.data.agent_id.toLowerCase() === filter;
        // thread
        const assignedAgent = item.data.replies[0]?.agent_id?.toLowerCase() || "";
        return assignedAgent === filter;
      });

  const FILTERS: { key: AgentFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "alfred", label: "Alfred" },
    { key: "roberto", label: "Roberto" },
    { key: "andres", label: "Andrés" },
    { key: "marina", label: "Marina" },
    { key: "arturo", label: "Arturo" },
    { key: "alex", label: "Alex" },
  ];

  if (loading) {
    return (
      <div
        className="flex-1 rounded-xl border border-[#27272A] p-4"
        style={{ background: "#141416" }}
      >
        <p className="text-[11px] text-zinc-600">Cargando actividad...</p>
      </div>
    );
  }

  return (
    <div
      className="flex-1 rounded-xl border border-[#27272A] p-4 flex flex-col min-h-0"
      style={{ background: "#141416" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2 shrink-0">
          <MessageSquare size={14} className="text-zinc-500" />
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Comunicaciones
          </h2>
        </div>
        <div className="flex-1 min-w-0 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all whitespace-nowrap shrink-0 ${
                filter === f.key
                  ? "bg-zinc-700 text-zinc-200"
                  : "text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-zinc-600 text-center py-4">
            Sin actividad reciente
          </p>
        ) : (
          filtered.map((item) => {
            if (item.type === "standalone") {
              return (
                <div key={item.data.id} className="flex justify-center py-1">
                  <span className="text-[10px] text-amber-400/60 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                    {item.data.text}
                  </span>
                </div>
              );
            }

            if (item.type === "standup") {
              const standup = item.data;
              return (
                <div
                  key={standup.id}
                  className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={14} className="text-blue-400" />
                    <span className="text-[11px] font-bold text-blue-400">
                      {standup.title}
                    </span>
                    <span className="text-[9px] text-zinc-600 ml-auto">
                      {timeAgo(standup.created_at)}
                    </span>
                  </div>
                  {standup.summary && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                      {standup.summary.length > 200
                        ? standup.summary.slice(0, 200) + "..."
                        : standup.summary}
                    </p>
                  )}
                  {standup.agents_involved.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {standup.agents_involved.map((a) => {
                        const s = getStyle(a);
                        return (
                          <span
                            key={a}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${s.avatar}`}
                          >
                            {a}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            if (item.type === "anomaly") {
              const anomaly = item.data;
              const agentStyle = getStyle(anomaly.agent_id);
              return (
                <div
                  key={anomaly.id}
                  className="rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-red-400" />
                    <span className="text-[11px] font-bold text-red-400">
                      {anomaly.title}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${agentStyle.avatar} ml-auto`}>
                      {anomaly.agent_id}
                    </span>
                  </div>
                  {anomaly.description && (
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {anomaly.description}
                    </p>
                  )}
                  <span className="text-[9px] text-zinc-600 mt-1 block">
                    {timeAgo(anomaly.created_at)}
                  </span>
                </div>
              );
            }

            const thread = item.data;
            const alfredStyle = getStyle("Alfred");
            const assignedAgent = thread.replies[0]?.agent_id || "roberto";
            const agentName = assignedAgent.charAt(0).toUpperCase() + assignedAgent.slice(1);
            const THREAD_BORDERS: Record<string, string> = {
              roberto: "border-purple-500/20",
              marina: "border-pink-500/20",
              andres: "border-amber-500/20",
              alfred: "border-blue-500/20",
              arturo: "border-yellow-500/20",
              alex: "border-red-500/20",
            };
            const borderClass = THREAD_BORDERS[assignedAgent.toLowerCase()] || "border-zinc-500/20";

            return (
              <div key={thread.id}>
                {/* Thread parent: Alfred's assignment */}
                <div className="flex items-start gap-2.5 py-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold ${alfredStyle.avatar}`}
                  >
                    A
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[11px] font-bold ${alfredStyle.text}`}>
                        Alfred
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {timeAgo(thread.parentTime)}
                      </span>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">
                      <MentionText
                        text={
                          thread.taskTitle
                            ? `@${agentName}, encárgate de esta tarea: "${thread.taskTitle}"`
                            : `@${agentName}, te asigno una nueva tarea.`
                        }
                      />
                    </p>
                    {thread.replies.length > 0 && (
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {thread.replies.length} respuesta{thread.replies.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                </div>

                {/* Thread replies */}
                {thread.replies.length > 0 && (
                  <div className={`ml-[18px] border-l-2 ${borderClass} pl-4 space-y-0.5 pb-1`}>
                    {thread.replies.map((reply) => {
                      const replyStyle = getStyle(reply.agent_id);
                      return (
                        <div key={reply.id} className="flex items-start gap-2 py-1.5">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${replyStyle.avatar}`}
                          >
                            {reply.agent_id.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[10px] font-bold ${replyStyle.text}`}>
                                {reply.agent_id}
                              </span>
                              <span className="text-[9px] text-zinc-600">
                                {timeAgo(reply.created_at)}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              <MentionText text={reply.text} />
                            </p>
                            {reply.detail && (
                              <div
                                className={`mt-1 px-2 py-1 rounded text-[10px] leading-relaxed ${
                                  reply.isError
                                    ? "bg-red-500/8 border border-red-500/15 text-red-300"
                                    : "bg-zinc-800/50 border border-zinc-700/30 text-zinc-500"
                                }`}
                              >
                                {reply.detail}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

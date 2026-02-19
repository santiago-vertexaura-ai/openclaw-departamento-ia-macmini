"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, MessageSquare, Sparkles, Pencil } from "lucide-react";
import ChatBubble, { BubbleType } from "./ChatBubble";
import ChatInput, { Attachment } from "./ChatInput";

interface AttachmentInfo {
  name: string;
  type: "image" | "audio" | "document";
  url?: string;
  size: number;
}

interface Message {
  id: string;
  type: BubbleType;
  content: string;
  timestamp: string;
  attachments?: AttachmentInfo[];
}

interface SessionListItem {
  id: string;
  title: string;
  updated_at: string;
}

const GATEWAY_URL = "/api/chat";
const SESSIONS_URL = "/api/chat-sessions";
const MAX_CONTEXT_MESSAGES = 20;

function extractSystemActions(text: string): string[] {
  const patterns = [
    /(?:llamando|spawning|delegando).*?roberto/i,
    /(?:creando tarea|task created)/i,
    /(?:buscando|searching|investigando)/i,
  ];
  const actions: string[] = [];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) actions.push(m[0]);
  }
  return actions;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function ChatPanel() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionTitle, setSessionTitle] = useState("Nueva conversación");
  const [sessionSummary, setSessionSummary] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [thinkingPhrase, setThinkingPhrase] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Rotate thinking phrases while streaming
  const THINKING_PHRASES = [
    "Alfred esta pensando",
    "Analizando tu mensaje",
    "Preparando respuesta",
    "Procesando",
  ];
  useEffect(() => {
    if (!streaming) return;
    const id = setInterval(() => {
      setThinkingPhrase((p) => (p + 1) % THINKING_PHRASES.length);
    }, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming]);

  const genId = () => {
    idCounter.current += 1;
    return `msg-${idCounter.current}-${Date.now()}`;
  };

  const now = () =>
    new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

  // Load sessions list
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${SESSIONS_URL}?t=${Date.now()}`);
        if (res.ok) {
          const data: SessionListItem[] = await res.json();
          setSessions(data);
          if (data.length > 0 && !activeSessionId) {
            loadSession(data[0].id);
          } else if (data.length === 0) {
            createNewSession();
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingSessions(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSession = async (sessionId: string) => {
    if (activeSessionId && activeSessionId !== sessionId) {
      await saveCurrentSession();
    }

    try {
      const res = await fetch(`${SESSIONS_URL}?id=${sessionId}&t=${Date.now()}`);
      if (!res.ok) return;

      const session = await res.json();
      if (session) {
        setActiveSessionId(sessionId);
        setMessages(session.messages || []);
        setSessionTitle(session.title || "Nueva conversación");
        setSessionSummary(session.summary);
        idCounter.current = (session.messages || []).length + 100;
      }
    } catch {
      // ignore
    }
  };

  const saveCurrentSession = async () => {
    if (!activeSessionId) return;
    try {
      await fetch(SESSIONS_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeSessionId,
          messages,
          title: sessionTitle,
          summary: sessionSummary,
        }),
      });
    } catch {
      // ignore
    }
  };

  // Save when messages change (debounced)
  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(SESSIONS_URL, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeSessionId,
            messages,
            title: sessionTitle,
            summary: sessionSummary,
          }),
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, title: sessionTitle, updated_at: new Date().toISOString() }
              : s
          )
        );
      } catch {
        // ignore
      }
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, sessionTitle, activeSessionId]);

  const createNewSession = async () => {
    if (activeSessionId) {
      await saveCurrentSession();
    }
    try {
      const res = await fetch(SESSIONS_URL, { method: "POST" });
      if (res.ok) {
        const session = await res.json();
        setActiveSessionId(session.id);
        setMessages([]);
        setSessionTitle("Nueva conversación");
        setSessionSummary(undefined);
        idCounter.current = 0;
        setSessions((prev) => [
          { id: session.id, title: session.title, updated_at: session.updated_at },
          ...prev,
        ]);
      }
    } catch {
      // ignore
    }
  };

  const saveSessionTitle = async (sessionId: string, newTitle: string) => {
    const title = newTitle.trim();
    if (!title) {
      setEditingSessionId(null);
      return;
    }
    try {
      await fetch(SESSIONS_URL, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, title }),
      });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
      );
      if (sessionId === activeSessionId) setSessionTitle(title);
    } catch {
      // ignore
    }
    setEditingSessionId(null);
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`${SESSIONS_URL}?id=${sessionId}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        const remaining = sessions.filter((s) => s.id !== sessionId);
        if (remaining.length > 0) {
          loadSession(remaining[0].id);
        } else {
          createNewSession();
        }
      }
    } catch {
      // ignore
    }
  };

  const generateTitle = async (userText: string, assistantText: string) => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Genera un título muy corto (3-5 palabras máximo) para esta conversación. Solo responde con el título, sin comillas ni puntuación extra.",
            },
            {
              role: "user",
              content: `Usuario: ${userText.slice(0, 200)}\nAsistente: ${assistantText.slice(0, 200)}`,
            },
          ],
        }),
      });
      if (!res.ok) return;

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let title = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) title += delta;
          } catch {
            // ignore
          }
        }
      }

      title = title.trim().replace(/^["']|["']$/g, "").slice(0, 50);
      if (title) {
        setSessionTitle(title);
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId ? { ...s, title } : s
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const buildContextMessages = () => {
    const conversationMessages = messages.filter((m) => m.type !== "system");

    if (conversationMessages.length <= MAX_CONTEXT_MESSAGES) {
      return conversationMessages.map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: m.content,
      }));
    }

    const contextMsgs = [];
    if (sessionSummary) {
      contextMsgs.push({
        role: "system" as const,
        content: `Resumen de la conversación anterior: ${sessionSummary}`,
      });
    }

    const recent = conversationMessages.slice(-MAX_CONTEXT_MESSAGES);
    for (const m of recent) {
      contextMsgs.push({
        role: m.type === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      });
    }

    return contextMsgs;
  };

  const generateSummary = async (msgs: Message[]) => {
    const conversationMsgs = msgs.filter((m) => m.type !== "system");
    if (conversationMsgs.length <= MAX_CONTEXT_MESSAGES || sessionSummary) return;

    const toSummarize = conversationMsgs.slice(0, -MAX_CONTEXT_MESSAGES);
    const summaryInput = toSummarize
      .map((m) => `${m.type === "user" ? "Usuario" : "Alfred"}: ${m.content.slice(0, 200)}`)
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Resume esta conversación en 2-3 frases concisas en español. Captura los temas principales y decisiones tomadas. Solo responde con el resumen.",
            },
            { role: "user", content: summaryInput },
          ],
        }),
      });
      if (!res.ok) return;

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let summary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) summary += delta;
          } catch {
            // ignore
          }
        }
      }

      if (summary.trim()) {
        setSessionSummary(summary.trim());
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async (text: string, attachments?: Attachment[]) => {
    if (!activeSessionId) return;

    const attachmentInfos: AttachmentInfo[] = (attachments || []).map((att) => ({
      name: att.file.name,
      type: att.type,
      url: att.preview || (att.type === "audio" ? URL.createObjectURL(att.file) : undefined),
      size: att.file.size,
    }));

    let displayText = text;
    const attachmentDescs: string[] = [];
    for (const att of attachmentInfos) {
      if (att.type === "audio") attachmentDescs.push(`[Audio: ${att.name}]`);
      else if (att.type === "image") attachmentDescs.push(`[Imagen: ${att.name}]`);
      else attachmentDescs.push(`[Archivo: ${att.name}]`);
    }
    if (attachmentDescs.length > 0 && !displayText) {
      displayText = attachmentDescs.join(" ");
    }

    const userMsg: Message = {
      id: genId(),
      type: "user",
      content: displayText,
      timestamp: now(),
      attachments: attachmentInfos.length > 0 ? attachmentInfos : undefined,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    setStreaming(true);
    const assistantId = genId();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, type: "assistant", content: "", timestamp: now() },
    ]);

    try {
      let apiText = text;
      if (attachmentDescs.length > 0) {
        apiText = (text ? text + "\n\n" : "") + "Archivos adjuntos: " + attachmentDescs.join(", ");
      }

      const contextMessages = buildContextMessages();
      const apiMessages = [
        ...contextMessages,
        { role: "user", content: apiText },
      ];

      const res = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) {
        const err = await res.text();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `Error: ${err}` } : m
          )
        );
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let accumulated = "";
      const systemActionsAdded = new Set<string>();
      const isFirstResponse = messages.filter((m) => m.type === "assistant").length === 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;

              const actions = extractSystemActions(accumulated);
              for (const action of actions) {
                if (!systemActionsAdded.has(action)) {
                  systemActionsAdded.add(action);
                  const sysMsg: Message = {
                    id: genId(),
                    type: "system",
                    content: action.charAt(0).toUpperCase() + action.slice(1) + "...",
                    timestamp: now(),
                  };
                  setMessages((prev) => {
                    const idx = prev.findIndex((m) => m.id === assistantId);
                    if (idx > 0) {
                      const copy = [...prev];
                      copy.splice(idx, 0, sysMsg);
                      return copy;
                    }
                    return prev;
                  });
                }
              }

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulated } : m
                )
              );
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }

      if (isFirstResponse && sessionTitle === "Nueva conversación" && accumulated) {
        generateTitle(text, accumulated);
      }

      setMessages((prev) => {
        generateSummary(prev);
        return prev;
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error de conexion: ${err}` }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        background: "#08080A",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.01)",
        }}
      >
        <button
          onClick={createNewSession}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: "16px 12px 12px",
            padding: "10px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            color: "#a1a1aa",
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "#d4d4d8";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            e.currentTarget.style.color = "#a1a1aa";
          }}
        >
          <Plus size={14} style={{ color: "#71717a" }} />
          Nueva conversación
        </button>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 8px",
            minHeight: 0,
          }}
        >
          {loadingSessions ? (
            <p style={{ fontSize: 11, color: "#3f3f46", textAlign: "center", padding: "16px 0" }}>
              Cargando...
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = activeSessionId === session.id;
              const isHovered = hoveredSession === session.id;
              return (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  onMouseEnter={() => setHoveredSession(session.id)}
                  onMouseLeave={() => setHoveredSession(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                    marginBottom: 2,
                    background: isActive
                      ? "rgba(255,255,255,0.06)"
                      : isHovered
                        ? "rgba(255,255,255,0.03)"
                        : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  <MessageSquare
                    size={13}
                    style={{
                      flexShrink: 0,
                      color: isActive ? "#71717a" : "#3f3f46",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingSessionId === session.id ? (
                      <input
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={() => saveSessionTitle(session.id, editingTitle)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveSessionTitle(session.id, editingTitle);
                          }
                          if (e.key === "Escape") setEditingSessionId(null);
                        }}
                        style={{
                          fontSize: 12,
                          lineHeight: 1.3,
                          color: "#d4d4d8",
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          width: "100%",
                          outline: "none",
                          margin: 0,
                        }}
                      />
                    ) : (
                      <p
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingSessionId(session.id);
                          setEditingTitle(session.title);
                        }}
                        style={{
                          fontSize: 12,
                          lineHeight: 1.3,
                          color: isActive ? "#d4d4d8" : "#a1a1aa",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          margin: 0,
                          cursor: "text",
                        }}
                        title="Doble click para editar"
                      >
                        {session.title}
                      </p>
                    )}
                    <p
                      style={{
                        fontSize: 10,
                        color: "#3f3f46",
                        margin: "2px 0 0",
                      }}
                    >
                      {timeLabel(session.updated_at)}
                    </p>
                  </div>
                  {isHovered && !editingSessionId && (
                    <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session.id);
                        setEditingTitle(session.title);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: 4,
                        borderRadius: 6,
                        color: "#52525b",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        transition: "all 0.12s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(99,102,241,0.15)";
                        e.currentTarget.style.color = "#818cf8";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#52525b";
                      }}
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      style={{
                        flexShrink: 0,
                        padding: 4,
                        borderRadius: 6,
                        color: "#52525b",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        transition: "all 0.12s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                        e.currentTarget.style.color = "#f87171";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "#52525b";
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 32px 16px",
            minHeight: 0,
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    margin: "0 auto 20px",
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <Sparkles size={24} style={{ color: "#6366f1" }} />
                </div>
                <p
                  style={{
                    color: "#52525b",
                    fontSize: 14,
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  Alfred
                </p>
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {messages.map((msg) =>
              msg.type === "assistant" && !msg.content ? null : (
                <ChatBubble
                  key={msg.id}
                  type={msg.type}
                  content={msg.content}
                  timestamp={msg.type !== "system" ? msg.timestamp : undefined}
                  attachments={msg.attachments}
                />
              )
            )}
          </div>
          {streaming && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0 4px",
              }}
            >
              <div className="thinking-orb" />
              <span
                key={thinkingPhrase}
                className="thinking-phrase"
                style={{
                  fontSize: 13,
                  color: "#818cf8",
                  fontWeight: 400,
                }}
              >
                {THINKING_PHRASES[thinkingPhrase]}...
              </span>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ flexShrink: 0, paddingBottom: 24 }}>
          <ChatInput onSend={handleSend} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}

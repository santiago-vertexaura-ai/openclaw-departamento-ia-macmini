"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, FileText, X, Star, Send, Trash2, Check, RotateCcw, XCircle, Sparkles } from "lucide-react";
import { useDocumentVisible } from "@/hooks/useVisibility";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AgentDoc, DocType, DocComment, ReviewStatus } from "@/types/docs";
import { DOC_TYPE_CONFIG, REVIEW_STATUS_CONFIG } from "@/types/docs";

function HalfStarRating({
  value,
  onChange,
  size = 14,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState<number>(0);
  const display = hover || value || 0;

  const handleClick = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isLeftHalf = clickX < rect.width / 2;
    const newValue = isLeftHalf ? star - 0.5 : star;
    onChange(newValue === value ? 0 : newValue);
  };

  const handleMouseMove = (star: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const isLeftHalf = hoverX < rect.width / 2;
    setHover(isLeftHalf ? star - 0.5 : star);
  };

  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fillLevel = display >= star ? 1 : display >= star - 0.5 ? 0.5 : 0;
        return (
          <button
            key={star}
            onClick={(e) => handleClick(star, e)}
            onMouseMove={(e) => handleMouseMove(star, e)}
            className="transition-colors relative"
            style={{ width: size, height: size }}
          >
            {/* Empty star background */}
            <Star
              size={size}
              className="text-zinc-700 absolute inset-0"
            />
            {/* Filled overlay with clip */}
            {fillLevel > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillLevel * 100}%` }}
              >
                <Star
                  size={size}
                  className="fill-amber-400 text-amber-400"
                />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CommentsSection({
  comments,
  onAddComment,
}: {
  comments: DocComment[];
  onAddComment: (text: string) => void;
}) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = () => {
    const text = newComment.trim();
    if (!text) return;
    onAddComment(text);
    setNewComment("");
  };

  return (
    <div className="mt-6 pt-4 border-t border-[#27272A]">
      <h4 className="text-sm font-semibold text-zinc-300 mb-3">
        Comentarios ({comments.length})
      </h4>

      {comments.length > 0 && (
        <div className="space-y-3 mb-4">
          {comments.map((c, i) => (
            <div
              key={i}
              className="bg-[#0A0A0B] border border-[#27272A] rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-zinc-300">
                  {c.author}
                </span>
                <span className="text-[10px] text-zinc-600">
                  {new Intl.DateTimeFormat("es-ES", {
                    timeZone: "Europe/Madrid",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(c.timestamp))}
                </span>
              </div>
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                {c.text}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1 bg-[#0A0A0B] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46]"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

function ReviewToolbar({
  doc,
  onReview,
}: {
  doc: AgentDoc;
  onReview: (action: string, feedback?: string) => void;
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAction = async (action: string) => {
    if (action === "request_revision") {
      setShowFeedback(true);
      return;
    }
    setSubmitting(true);
    await onReview(action);
    setSubmitting(false);
  };

  const handleSubmitRevision = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    await onReview("request_revision", feedback.trim());
    setSubmitting(false);
    setShowFeedback(false);
    setFeedback("");
  };

  const status = doc.review_status;
  const statusConfig = status ? REVIEW_STATUS_CONFIG[status] : null;

  return (
    <div className="mb-6 p-4 rounded-xl border border-[#27272A] bg-[#0A0A0B]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase">Review</span>
          {statusConfig && (
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ color: statusConfig.color, backgroundColor: statusConfig.bg }}
            >
              {statusConfig.label}
            </span>
          )}
        </div>
      </div>

      {status !== "approved" && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction("approve")}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Check size={13} /> Aprobar
          </button>
          <button
            onClick={() => handleAction("request_revision")}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all disabled:opacity-50"
          >
            <RotateCcw size={13} /> Pedir Revision
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
          >
            <XCircle size={13} /> Rechazar
          </button>
        </div>
      )}

      {status === "approved" && (
        <p className="text-xs text-emerald-400/70">Este draft ha sido aprobado.</p>
      )}

      {showFeedback && (
        <div className="mt-3">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Describe que cambios quieres... (se creara una tarea para Marina)"
            rows={3}
            className="w-full bg-[#141416] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => { setShowFeedback(false); setFeedback(""); }}
              className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmitRevision}
              disabled={!feedback.trim() || submitting}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all disabled:opacity-30"
            >
              {submitting ? "Enviando..." : "Enviar Revision"}
            </button>
          </div>
        </div>
      )}

      {doc.review_feedback && !showFeedback && (
        <div className="mt-3 p-3 rounded-lg bg-[#141416] border border-[#27272A]">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase">Ultimo feedback</span>
          <p className="text-xs text-zinc-400 mt-1">{doc.review_feedback}</p>
        </div>
      )}
    </div>
  );
}

type ReviewFilter = "all" | ReviewStatus;
const REVIEW_FILTERS: { key: ReviewFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending_review", label: "Pendientes" },
  { key: "approved", label: "Aprobados" },
  { key: "revision_requested", label: "En Revision" },
];

const ALL_TYPES: (DocType | "all")[] = ["all", "research", "journal", "aprendizaje", "report", "analysis", "estrategia", "draft"];

function formatRelativeTime(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60000) return "hace menos de 1 min";
  if (ms < 3600000) return `hace ${Math.round(ms / 60000)} min`;
  if (ms < 86400000) return `hace ${Math.round(ms / 3600000)}h`;
  return `hace ${Math.round(ms / 86400000)}d`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function DocsPanel() {
  const [docs, setDocs] = useState<AgentDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<DocType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("all");
  const [showContentForm, setShowContentForm] = useState(false);
  const [contentPlatforms, setContentPlatforms] = useState<Record<string, boolean>>({
    linkedin: true,
    twitter: true,
    instagram: true,
  });
  const [contentNotes, setContentNotes] = useState("");
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentFeedback, setContentFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const contentCacheRef = useRef<Map<string, string>>(new Map());
  const visible = useDocumentVisible();

  const fetchDocs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("doc_type", filterType);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/docs?${params}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setDocs(data.map((d: AgentDoc) => ({ ...d, content: d.content || "", comments: d.comments || [] })));
        setSelectedId((prev) => {
          if (prev && !data.some((d: AgentDoc) => d.id === prev)) return null;
          return prev;
        });
      }
    } catch (e) {
      console.error("Error loading docs:", e);
    } finally {
      setLoading(false);
    }
  }, [filterType, searchQuery]);

  // Fetch full content on demand when user selects a doc
  const fetchDocContent = useCallback(async (docId: string) => {
    if (contentCacheRef.current.has(docId)) {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, content: contentCacheRef.current.get(docId)! } : d
        )
      );
      return;
    }
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/docs?id=${docId}&t=${Date.now()}`);
      if (res.ok) {
        const fullDoc = await res.json();
        contentCacheRef.current.set(docId, fullDoc.content || "");
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId ? { ...d, content: fullDoc.content || "" } : d
          )
        );
      } else {
        console.error("Doc content fetch failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("Error fetching doc content:", err);
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const handleSelectDoc = useCallback((docId: string) => {
    setSelectedId(docId);
    setShowContentForm(false);
    setContentFeedback(null);
    fetchDocContent(docId);
  }, [fetchDocContent]);

  useEffect(() => {
    setLoading(true);
    fetchDocs();
  }, [fetchDocs]);

  // Poll every 60s only when tab is visible (Realtime blocked by RLS on agent_docs)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!visible) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(fetchDocs, 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchDocs, visible]);

  const handleRating = async (docId: string, rating: number) => {
    const newRating = rating === 0 ? null : rating;
    setDocs((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, rating: newRating } : d))
    );
    try {
      await fetch("/api/docs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, rating: newRating }),
      });
    } catch {
      fetchDocs();
    }
  };

  const handleAddComment = async (docId: string, text: string) => {
    const comment: DocComment = {
      author: "Santi",
      text,
      timestamp: new Date().toISOString(),
    };
    setDocs((prev) =>
      prev.map((d) =>
        d.id === docId ? { ...d, comments: [...d.comments, comment] } : d
      )
    );
    try {
      const doc = docs.find((d) => d.id === docId);
      const updatedComments = [...(doc?.comments || []), comment];
      await fetch("/api/docs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: docId, comments: updatedComments }),
      });
    } catch {
      fetchDocs();
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      const res = await fetch(`/api/docs?id=${docId}`, { method: "DELETE" });
      if (res.ok) {
        setDocs((prev) => prev.filter((d) => d.id !== docId));
        contentCacheRef.current.delete(docId);
        if (selectedId === docId) setSelectedId(null);
      }
    } catch {
      // ignore
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleReview = async (docId: string, action: string, feedback?: string) => {
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, action, feedback }),
      });
      if (res.ok) {
        const result = await res.json();
        // Optimistic update
        setDocs((prev) =>
          prev.map((d) =>
            d.id === docId
              ? {
                  ...d,
                  review_status: result.review_status as ReviewStatus,
                  review_feedback: feedback || d.review_feedback,
                  comments: feedback
                    ? [
                        ...d.comments,
                        {
                          author: "Santi",
                          text: `[${action === "approve" ? "Aprobado" : action === "reject" ? "Rechazado" : "Revision solicitada"}] ${feedback}`,
                          timestamp: new Date().toISOString(),
                        },
                      ]
                    : d.comments,
                }
              : d
          )
        );
      }
    } catch {
      fetchDocs();
    }
  };

  const handleCreateContentTask = async (docId: string) => {
    setContentSubmitting(true);
    setContentFeedback(null);
    try {
      const platforms = Object.entries(contentPlatforms)
        .filter(([, v]) => v)
        .map(([k]) => k);
      const res = await fetch("/api/content-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_id: docId,
          platforms,
          notes: contentNotes.trim() || undefined,
        }),
      });
      if (res.ok) {
        setContentFeedback({ type: "success", message: "Tarea creada" });
        setShowContentForm(false);
        setContentNotes("");
        setContentPlatforms({ linkedin: true, twitter: true, instagram: true });
        setTimeout(() => setContentFeedback(null), 3000);
      } else if (res.status === 409) {
        setContentFeedback({ type: "error", message: "Ya existe tarea para este doc" });
        setTimeout(() => setContentFeedback(null), 4000);
      } else {
        const data = await res.json();
        setContentFeedback({ type: "error", message: data.error || "Error al crear tarea" });
        setTimeout(() => setContentFeedback(null), 4000);
      }
    } catch {
      setContentFeedback({ type: "error", message: "Error de conexion" });
      setTimeout(() => setContentFeedback(null), 4000);
    } finally {
      setContentSubmitting(false);
    }
  };

  const CONTENT_ELIGIBLE_TYPES = ["research", "analysis", "report"];

  // Filter docs by review status
  const filteredDocs = reviewFilter === "all"
    ? docs
    : docs.filter((d) => d.review_status === reviewFilter);

  const selectedDoc = docs.find((d) => d.id === selectedId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xl font-bold text-zinc-100">Docs</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400">
          {docs.length} documentos
        </span>
        {docs.filter((d) => d.review_status === "pending_review").length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 animate-pulse">
            {docs.filter((d) => d.review_status === "pending_review").length} pendientes
          </span>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141416] border border-[#27272A] rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type Pills */}
        <div className="flex gap-1.5">
          {ALL_TYPES.map((type) => {
            const isActive = filterType === type;
            const config = type !== "all" ? DOC_TYPE_CONFIG[type] : null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                  isActive
                    ? "bg-[#27272A] text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-[#141416]"
                }`}
              >
                {config ? (
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </span>
                ) : (
                  "Todos"
                )}
              </button>
            );
          })}
        </div>

        {/* Review Status Filter (separator) */}
        <div className="w-px h-5 bg-[#27272A]" />
        <div className="flex gap-1">
          {REVIEW_FILTERS.map((rf) => (
            <button
              key={rf.key}
              onClick={() => setReviewFilter(rf.key)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                reviewFilter === rf.key
                  ? "bg-[#27272A] text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-400 hover:bg-[#141416]"
              }`}
            >
              {rf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: Split View */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: Doc List */}
        <div className="w-[320px] flex-shrink-0 overflow-y-auto pr-1 space-y-2">
          {loading ? (
            <p className="text-sm text-zinc-500 py-4 text-center">Cargando...</p>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No hay documentos</p>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const config = DOC_TYPE_CONFIG[doc.doc_type];
              const isActive = selectedId === doc.id;
              const cached = contentCacheRef.current.get(doc.id);
              const preview = cached
                ? cached.replace(/[#*_`>\[\]]/g, "").substring(0, 100)
                : doc.title;
              return (
                <button
                  key={doc.id}
                  onClick={() => handleSelectDoc(doc.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? "bg-[#1C1C1F] border-[#3F3F46]"
                      : "bg-[#141416] border-[#27272A] hover:border-[#3F3F46]"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config?.color || "#71717A" }}
                    />
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase">
                      {config?.label || doc.doc_type}
                    </span>
                    {doc.review_status && doc.doc_type === "draft" && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          color: REVIEW_STATUS_CONFIG[doc.review_status]?.color,
                          backgroundColor: REVIEW_STATUS_CONFIG[doc.review_status]?.bg,
                        }}
                      >
                        {REVIEW_STATUS_CONFIG[doc.review_status]?.label}
                      </span>
                    )}
                    <span className="text-[9px] text-zinc-600 ml-auto">
                      {formatRelativeTime(doc.created_at)}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-200 mb-1 line-clamp-1">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-zinc-500 line-clamp-2">{preview}...</p>
                  <div className="flex items-center justify-between mt-2">
                    {doc.tags.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#27272A] text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-1.5">
                      {doc.comments.length > 0 && (
                        <span className="text-[9px] text-zinc-600">
                          {doc.comments.length} com.
                        </span>
                      )}
                      <HalfStarRating
                        value={doc.rating}
                        onChange={(r) => handleRating(doc.id, r)}
                        size={12}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right: Document Viewer */}
        <div className="flex-1 bg-[#141416] border border-[#27272A] rounded-xl overflow-y-auto min-h-0">
          {selectedDoc ? (
            <div className="p-6">
              {/* Doc Header */}
              <div className="mb-6 pb-4 border-b border-[#27272A]">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        DOC_TYPE_CONFIG[selectedDoc.doc_type]?.color || "#71717A",
                    }}
                  />
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase">
                    {DOC_TYPE_CONFIG[selectedDoc.doc_type]?.label || selectedDoc.doc_type}
                  </span>
                  <span className="text-[10px] text-zinc-600 ml-2">
                    {selectedDoc.word_count} palabras
                  </span>
                  {selectedDoc.review_status && selectedDoc.doc_type === "draft" && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-2"
                      style={{
                        color: REVIEW_STATUS_CONFIG[selectedDoc.review_status]?.color,
                        backgroundColor: REVIEW_STATUS_CONFIG[selectedDoc.review_status]?.bg,
                      }}
                    >
                      {REVIEW_STATUS_CONFIG[selectedDoc.review_status]?.label}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-2">
                  {selectedDoc.title}
                </h1>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span>Por {selectedDoc.author}</span>
                  <span>{formatDate(selectedDoc.created_at)}</span>
                  <div className="ml-auto flex items-center gap-3">
                    {contentFeedback && (
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-opacity duration-500 ${
                          contentFeedback.type === "success"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {contentFeedback.message}
                      </span>
                    )}
                    {CONTENT_ELIGIBLE_TYPES.includes(selectedDoc.doc_type) && (
                      <button
                        onClick={() => setShowContentForm((prev) => !prev)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          showContentForm
                            ? "text-blue-300 bg-blue-500/20 border border-blue-500/30"
                            : "text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
                        }`}
                        title="Crear tarea de contenido para Marina"
                      >
                        <Sparkles size={13} />
                        Crear Contenido
                      </button>
                    )}
                    <HalfStarRating
                      value={selectedDoc.rating}
                      onChange={(r) => handleRating(selectedDoc.id, r)}
                      size={16}
                    />
                    <button
                      onClick={() => setDeleteConfirm(selectedDoc.id)}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Eliminar documento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {selectedDoc.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {selectedDoc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#27272A] text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Creation Form */}
              {showContentForm && CONTENT_ELIGIBLE_TYPES.includes(selectedDoc.doc_type) && (
                <div className="mb-6 p-4 rounded-xl border border-blue-500/20 bg-[#0A0A0B]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-blue-400" />
                    <span className="text-[11px] font-semibold text-zinc-300 uppercase">
                      Crear Tarea de Contenido
                    </span>
                  </div>

                  {/* Platform checkboxes */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase mb-2 block">
                      Plataformas
                    </span>
                    <div className="flex gap-3">
                      {[
                        { key: "linkedin", label: "LinkedIn" },
                        { key: "twitter", label: "Twitter/X" },
                        { key: "instagram", label: "Instagram" },
                      ].map((p) => (
                        <label
                          key={p.key}
                          className="flex items-center gap-1.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={contentPlatforms[p.key]}
                            onChange={(e) =>
                              setContentPlatforms((prev) => ({
                                ...prev,
                                [p.key]: e.target.checked,
                              }))
                            }
                            className="w-3.5 h-3.5 rounded border-[#3F3F46] bg-[#141416] text-blue-500 accent-blue-500 focus:ring-0 focus:ring-offset-0"
                          />
                          <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                            {p.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notes textarea */}
                  <div className="mb-3">
                    <span className="text-[10px] font-semibold text-zinc-500 uppercase mb-2 block">
                      Como enfocar este contenido?
                    </span>
                    <textarea
                      value={contentNotes}
                      onChange={(e) => setContentNotes(e.target.value)}
                      placeholder="Ej: Enfocarlo en tips practicos para emprendedores, tono cercano..."
                      rows={3}
                      className="w-full bg-[#141416] border border-[#27272A] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/30 resize-none"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowContentForm(false);
                        setContentNotes("");
                        setContentPlatforms({ linkedin: true, twitter: true, instagram: true });
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleCreateContentTask(selectedDoc.id)}
                      disabled={
                        contentSubmitting ||
                        !Object.values(contentPlatforms).some(Boolean)
                      }
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Sparkles size={12} />
                      {contentSubmitting ? "Creando..." : "Crear Tarea Marina"}
                    </button>
                  </div>
                </div>
              )}

              {/* Review Toolbar (only for drafts) */}
              {selectedDoc.doc_type === "draft" && (
                <ReviewToolbar
                  doc={selectedDoc}
                  onReview={(action, feedback) => handleReview(selectedDoc.id, action, feedback)}
                />
              )}

              {/* Markdown Content */}
              {loadingContent && !selectedDoc.content ? (
                <p className="text-sm text-zinc-500 py-8 text-center">Cargando contenido...</p>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-a:text-blue-400 prose-strong:text-zinc-200 prose-code:text-purple-300 prose-code:bg-[#27272A] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-[#0A0A0B] prose-pre:border prose-pre:border-[#27272A] prose-blockquote:border-l-purple-500 prose-blockquote:text-zinc-400 prose-li:text-zinc-300 prose-th:text-zinc-300 prose-td:text-zinc-400">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedDoc.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Comments */}
              <CommentsSection
                comments={selectedDoc.comments}
                onAddComment={(text) => handleAddComment(selectedDoc.id, text)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText size={40} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-sm text-zinc-500">Selecciona un documento</p>
                <p className="text-[11px] text-zinc-600 mt-1">
                  Los documentos de Roberto aparecen aqui
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="rounded-xl border border-[#27272A] p-6 w-[400px] shadow-2xl" style={{ background: "#141416" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Eliminar documento</h3>
                <p className="text-[11px] text-zinc-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-5">
              ¿Estás seguro de que quieres eliminar{" "}
              <span className="font-semibold text-zinc-200">
                {docs.find((d) => d.id === deleteConfirm)?.title || "este documento"}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 bg-[#0A0A0B] hover:bg-[#1C1C1F] border border-[#27272A] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

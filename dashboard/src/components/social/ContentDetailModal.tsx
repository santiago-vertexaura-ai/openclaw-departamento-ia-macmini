"use client";

import { useState } from "react";
import {
  X,
  Check,
  RotateCcw,
  Ban,
  Clock,
  Hash,
  Image,
  Beaker,
  User,
  FileText,
} from "lucide-react";
import {
  ContentCalendarItem,
  CalendarStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
} from "@/types/calendar";

interface ContentDetailModalProps {
  item: ContentCalendarItem;
  onClose: () => void;
  onUpdated: (item: ContentCalendarItem) => void;
}

export default function ContentDetailModal({
  item,
  onClose,
  onUpdated,
}: ContentDetailModalProps) {
  const [feedback, setFeedback] = useState(item.feedback || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: CalendarStatus) => {
    if (newStatus === "revision" && !feedback.trim()) {
      setError("El feedback es obligatorio para solicitar revision");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/content-calendar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          status: newStatus,
          feedback: feedback.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al actualizar");
        return;
      }

      const updated = await res.json();
      onUpdated(updated);
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  const platformColor = PLATFORM_COLORS[item.platform];
  const platformLabel = PLATFORM_LABELS[item.platform];
  const statusColor = STATUS_COLORS[item.status];
  const statusLabel = STATUS_LABELS[item.status];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#0A0A0B] border-l border-[#27272A] z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold px-2 py-1 rounded"
              style={{
                background: `${platformColor}20`,
                color: platformColor,
              }}
            >
              {platformLabel}
            </span>
            <span
              className="flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded"
              style={{
                background: `${statusColor}15`,
                color: statusColor,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusColor }}
              />
              {statusLabel}
            </span>
            {item.version > 1 && (
              <span className="text-[10px] text-zinc-500 font-mono">
                v{item.version}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Hook */}
          {item.hook && (
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block flex items-center gap-1">
                <FileText size={10} />
                Hook
              </label>
              <div className="text-sm text-amber-300 font-medium bg-amber-500/5 border border-amber-500/10 rounded-lg p-3">
                {item.hook}
              </div>
            </div>
          )}

          {/* Content preview */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block flex items-center gap-1">
              <FileText size={10} />
              Contenido
            </label>
            <div
              className="text-sm text-zinc-300 leading-relaxed bg-[#141416] border border-[#27272A] rounded-lg p-4 max-h-[300px] overflow-y-auto whitespace-pre-wrap"
            >
              {item.content}
            </div>
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Suggested time */}
            {item.suggested_time && (
              <div className="bg-[#141416] border border-[#27272A] rounded-lg p-3">
                <label className="text-[9px] font-semibold text-zinc-600 uppercase mb-1 block flex items-center gap-1">
                  <Clock size={9} />
                  Hora sugerida
                </label>
                <p className="text-xs text-zinc-300">
                  {new Date(item.suggested_time).toLocaleString("es-AR", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {/* Formula ref */}
            {item.formula_ref && (
              <div className="bg-[#141416] border border-[#27272A] rounded-lg p-3">
                <label className="text-[9px] font-semibold text-zinc-600 uppercase mb-1 block flex items-center gap-1">
                  <Beaker size={9} />
                  Formula
                </label>
                <p className="text-xs text-green-400 font-mono">
                  {item.formula_ref}
                </p>
              </div>
            )}

            {/* Created by */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-3">
              <label className="text-[9px] font-semibold text-zinc-600 uppercase mb-1 block flex items-center gap-1">
                <User size={9} />
                Creado por
              </label>
              <p className="text-xs text-zinc-300 capitalize">{item.created_by}</p>
            </div>

            {/* Version */}
            <div className="bg-[#141416] border border-[#27272A] rounded-lg p-3">
              <label className="text-[9px] font-semibold text-zinc-600 uppercase mb-1 block">
                Version
              </label>
              <p className="text-xs text-zinc-300 font-mono">v{item.version}</p>
            </div>
          </div>

          {/* Hashtags */}
          {item.hashtags && item.hashtags.length > 0 && (
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block flex items-center gap-1">
                <Hash size={10} />
                Hashtags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {item.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/15 px-2 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Visual brief */}
          {item.visual_brief && (
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block flex items-center gap-1">
                <Image size={10} />
                Brief visual
              </label>
              <div className="text-xs text-zinc-400 bg-[#141416] border border-[#27272A] rounded-lg p-3">
                {item.visual_brief}
              </div>
            </div>
          )}

          {/* Previous feedback */}
          {item.feedback && item.status !== "pending_review" && (
            <div>
              <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
                Feedback anterior
              </label>
              <div className="text-xs text-zinc-400 bg-yellow-500/5 border border-yellow-500/10 rounded-lg p-3 italic">
                {item.feedback}
              </div>
            </div>
          )}

          {/* Feedback textarea */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Feedback / Notas
            </label>
            <textarea
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                setError(null);
              }}
              placeholder="Escribe feedback para revision, o notas antes de aprobar..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/15 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer - Action buttons */}
        <div className="p-5 border-t border-[#27272A] space-y-3">
          <div className="flex gap-2">
            {/* Approve */}
            <button
              onClick={() => handleStatusChange("approved")}
              disabled={saving || item.status === "approved"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-30 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/20"
            >
              <Check size={14} />
              Aprobar
            </button>

            {/* Revision */}
            <button
              onClick={() => handleStatusChange("revision")}
              disabled={saving || item.status === "revision"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-30 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/20"
            >
              <RotateCcw size={14} />
              Revision
            </button>

            {/* Reject */}
            <button
              onClick={() => handleStatusChange("rejected")}
              disabled={saving || item.status === "rejected"}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-30 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/20"
            >
              <Ban size={14} />
              Rechazar
            </button>
          </div>

          {saving && (
            <div className="text-center text-[10px] text-zinc-500">
              Actualizando...
            </div>
          )}
        </div>
      </div>
    </>
  );
}

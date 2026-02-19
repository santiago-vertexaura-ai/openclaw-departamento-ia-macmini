"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2, MessageSquare, Send } from "lucide-react";
import type { AgentTask, TaskComment } from "@/types/tasks";
import {
  AGENT_COLORS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  TASK_PRIORITIES,
} from "@/types/tasks";

interface TaskDetailPanelProps {
  task: AgentTask | null;
  onClose: () => void;
  onUpdated: () => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdated,
}: TaskDetailPanelProps) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descValue, setDescValue] = useState("");
  const [newComment, setNewComment] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescValue(task.description || "");
      setConfirmDelete(false);
    }
  }, [task]);

  const updateField = useCallback(
    async (field: string, value: unknown) => {
      if (!task) return;
      await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, [field]: value }),
      });
      onUpdated();
    },
    [task, onUpdated]
  );

  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    const comment: TaskComment = {
      author: "Santi",
      text: newComment.trim(),
      timestamp: new Date().toISOString(),
    };
    const comments = [...(task.comments || []), comment];
    await updateField("comments", comments);
    setNewComment("");
  };

  const handleDelete = async () => {
    if (!task) return;
    setDeleting(true);
    await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" });
    setDeleting(false);
    onUpdated();
    onClose();
  };

  if (!task) return null;

  const statusColor = STATUS_COLORS[task.status];
  const agentColor = AGENT_COLORS[task.assigned_to] || "#71717A";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-[#0A0A0B] border-l border-[#27272A] z-50 flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#27272A]">
          <div className="flex-1 mr-3">
            {editingTitle ? (
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={() => {
                  setEditingTitle(false);
                  if (titleValue.trim() && titleValue !== task.title) {
                    updateField("title", titleValue.trim());
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                className="w-full text-lg font-bold bg-transparent text-zinc-100 border-b border-blue-500 outline-none pb-1"
                autoFocus
              />
            ) : (
              <h2
                className="text-lg font-bold text-zinc-100 cursor-pointer hover:text-white transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${statusColor}20`,
                  color: statusColor,
                }}
              >
                {task.status.replace("_", " ")}
              </span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{
                  backgroundColor: `${agentColor}15`,
                  color: agentColor,
                }}
              >
                {task.assigned_to}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors mt-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Details */}
          <div className="p-5 border-b border-[#1C1C1F]">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-3">
              Detalles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#141416] rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 mb-1">Tipo</p>
                <p className="text-xs text-zinc-300">
                  {task.task_type.replace(/_/g, " ")}
                </p>
              </div>
              <div className="bg-[#141416] rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 mb-1">Prioridad</p>
                <div className="flex gap-1">
                  {TASK_PRIORITIES.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => updateField("priority", p.key)}
                      className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                        task.priority === p.key
                          ? "font-bold"
                          : "text-zinc-600 hover:text-zinc-400"
                      }`}
                      style={
                        task.priority === p.key
                          ? {
                              backgroundColor: `${PRIORITY_COLORS[p.key]}20`,
                              color: PRIORITY_COLORS[p.key],
                            }
                          : {}
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#141416] rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 mb-1">Creada</p>
                <p className="text-xs text-zinc-300">
                  {formatDate(task.created_at)}
                </p>
              </div>
              <div className="bg-[#141416] rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 mb-1">Completada</p>
                <p className="text-xs text-zinc-300">
                  {formatDate(task.completed_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-5 border-b border-[#1C1C1F]">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-2">
              Descripcion
            </h3>
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={() => {
                if (descValue !== (task.description || "")) {
                  updateField("description", descValue || null);
                }
              }}
              placeholder="Añadir descripcion..."
              rows={3}
              className="w-full px-3 py-2 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors resize-none"
            />
          </div>

          {/* Result */}
          {task.result && (
            <div className="p-5 border-b border-[#1C1C1F]">
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-2">
                Resultado
              </h3>
              <pre className="text-xs text-zinc-400 bg-[#141416] border border-[#27272A] rounded-lg p-3 overflow-x-auto max-h-60">
                {JSON.stringify(task.result, null, 2)}
              </pre>
            </div>
          )}

          {/* Brief */}
          {task.brief && (
            <div className="p-5 border-b border-[#1C1C1F]">
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-2">
                Brief
              </h3>
              <pre className="text-xs text-zinc-400 bg-[#141416] border border-[#27272A] rounded-lg p-3 overflow-x-auto max-h-40">
                {JSON.stringify(task.brief, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {task.error && (
            <div className="p-5 border-b border-[#1C1C1F]">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-300">{task.error}</p>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="p-5">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase mb-3 flex items-center gap-1.5">
              <MessageSquare size={12} />
              Comentarios ({(task.comments || []).length})
            </h3>

            {/* Comment list */}
            <div className="space-y-3 mb-4">
              {(task.comments || []).map((comment: TaskComment, i: number) => (
                <div key={i} className="flex gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `${AGENT_COLORS[comment.author] || "#71717A"}20`,
                      color: AGENT_COLORS[comment.author] || "#71717A",
                    }}
                  >
                    {comment.author[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                        {comment.author}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {relativeTime(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      {comment.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* New comment input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addComment();
                }}
                placeholder="Escribir comentario..."
                className="flex-1 px-3 py-2 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors"
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg transition-colors"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer: delete */}
        <div className="p-5 border-t border-[#27272A]">
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                {deleting ? "Eliminando..." : "Confirmar"}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 text-sm font-semibold rounded-lg bg-[#141416] border border-[#27272A] text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-2 text-xs text-zinc-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} />
              Eliminar tarea
            </button>
          )}
        </div>
      </div>
    </>
  );
}

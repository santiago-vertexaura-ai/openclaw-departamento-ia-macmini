"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TASK_PRIORITIES } from "@/types/tasks";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const TASK_TYPES = [
  "youtube_analysis",
  "twitter_scan",
  "news_scan",
  "instagram_scan",
  "content_creation",
  "hook_adaptation",
  "repurposing",
  "report",
  "research",
  "other",
];

const AGENTS = [
  { key: "roberto", label: "Roberto", selectedClass: "bg-purple-500/15 text-purple-400 border border-purple-500/30" },
  { key: "alfred", label: "Alfred", selectedClass: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30" },
  { key: "andres", label: "Andrés", selectedClass: "bg-orange-500/15 text-orange-400 border border-orange-500/30" },
  { key: "marina", label: "Marina", selectedClass: "bg-pink-500/15 text-pink-400 border border-pink-500/30" },
];

export default function CreateTaskModal({
  open,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState(AGENTS[0].key);
  const [taskType, setTaskType] = useState("youtube_analysis");
  const [priority, setPriority] = useState<string>("media");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          assigned_to: assignedTo,
          task_type: taskType,
          priority,
          created_by: "Santi",
        }),
      });
      setTitle("");
      setDescription("");
      setPriority("media");
      onCreated();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#0A0A0B] border-l border-[#27272A] z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <h2 className="text-lg font-bold text-zinc-100">Nueva Tarea</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Titulo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Analizar ultimo video de Alex Finn"
              className="w-full px-3 py-2.5 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones adicionales..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors resize-none"
            />
          </div>

          {/* Agent */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Asignar a
            </label>
            <div className="flex gap-2">
              {AGENTS.map((agent) => (
                <button
                  key={agent.key}
                  onClick={() => setAssignedTo(agent.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    assignedTo === agent.key
                      ? agent.selectedClass
                      : "bg-[#141416] border border-[#27272A] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {agent.label}
                </button>
              ))}
            </div>
          </div>

          {/* Task Type */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Tipo de tarea
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-200 focus:outline-none focus:border-[#3F3F46] transition-colors"
            >
              {TASK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">
              Prioridad
            </label>
            <div className="flex gap-2">
              {TASK_PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPriority(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    priority === p.key
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-[#141416] border border-[#27272A] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#27272A]">
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="w-full py-2.5 text-sm font-semibold rounded-lg transition-all disabled:opacity-40 bg-blue-600 hover:bg-blue-500 text-white"
          >
            {saving ? "Creando..." : "Crear Tarea"}
          </button>
        </div>
      </div>
    </>
  );
}

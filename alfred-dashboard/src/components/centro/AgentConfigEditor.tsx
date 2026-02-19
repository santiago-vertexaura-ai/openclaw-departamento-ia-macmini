"use client";

import { useState, useEffect } from "react";
import { X, Save, Check } from "lucide-react";

interface AgentConfigEditorProps {
  agent: "alfred" | "roberto" | "andres" | "marina" | "arturo" | "alex";
  agentLabel: string;
  onClose: () => void;
}

const AGENT_FILES: Record<string, string[]> = {
  alfred: ["SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md", "USER.md", "HEARTBEAT.md"],
  roberto: ["SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md", "IDENTITY.md"],
  andres: ["IDENTITY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md"],
  marina: ["IDENTITY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md"],
  arturo: ["IDENTITY.md", "SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md"],
  alex: ["SOUL.md", "AGENTS.md", "TOOLS.md", "MEMORY.md", "IDENTITY.md"],
};

export default function AgentConfigEditor({ agent, agentLabel, onClose }: AgentConfigEditorProps) {
  const files = AGENT_FILES[agent] || [];
  const [activeFile, setActiveFile] = useState(files[0] || "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFile) return;
    setLoading(true);
    setSavedAt(null);
    fetch(`/api/agent-files?agent=${agent}&file=${activeFile}`)
      .then((r) => r.json())
      .then((data) => setContent(data.content || ""))
      .catch(() => setContent(""))
      .finally(() => setLoading(false));
  }, [agent, activeFile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/agent-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent, file: activeFile, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedAt(data.savedAt);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] rounded-xl border border-[#27272A] flex flex-col animate-slide-in"
        style={{ background: "#0A0A0B" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#27272A]">
          <h2 className="text-sm font-bold text-zinc-100">
            Configurar {agentLabel}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* File tabs */}
        <div className="flex gap-1 px-4 pt-3 pb-1 overflow-x-auto">
          {files.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFile(f)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeFile === f
                  ? "bg-blue-500/15 text-blue-400"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 px-4 py-2 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[11px] text-zinc-600">Cargando...</p>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setSavedAt(null);
              }}
              className="w-full h-full resize-none rounded-lg border border-[#27272A] p-3 text-[12px] font-mono text-zinc-300 focus:outline-none focus:border-blue-500/40"
              style={{ background: "#141416", minHeight: "350px" }}
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#27272A]">
          <div>
            {savedAt && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Check size={12} />
                Guardado — cambios efectivos en la proxima interaccion
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-medium transition-colors bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40"
          >
            <Save size={12} />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

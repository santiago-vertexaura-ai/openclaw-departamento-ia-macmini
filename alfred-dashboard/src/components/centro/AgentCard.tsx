"use client";

import { AgentStatusData } from "@/hooks/useAgentStatus";
import { FileEdit, CheckCircle2, Clock } from "lucide-react";
import Image from "next/image";

interface AgentCardProps {
  name: string;
  role: string;
  model: string;
  status: AgentStatusData;
  onConfigure?: () => void;
}

const GRADIENTS: Record<string, { avatar: string; border: string; glow: string }> = {
  Alfred: {
    avatar: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "linear-gradient(90deg, #3b82f6, #6366f1)",
    glow: "rgba(99, 102, 241, 0.15)",
  },
  Roberto: {
    avatar: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    border: "linear-gradient(90deg, #8b5cf6, #ec4899)",
    glow: "rgba(168, 85, 247, 0.15)",
  },
  "Andrés": {
    avatar: "linear-gradient(135deg, #F59E0B, #EF4444)",
    border: "linear-gradient(90deg, #F59E0B, #EF4444)",
    glow: "rgba(245, 158, 11, 0.15)",
  },
  Marina: {
    avatar: "linear-gradient(135deg, #EC4899, #F472B6)",
    border: "linear-gradient(90deg, #EC4899, #F472B6)",
    glow: "rgba(236, 72, 153, 0.15)",
  },
  Arturo: {
    avatar: "linear-gradient(135deg, #EAB308, #F59E0B)",
    border: "linear-gradient(90deg, #EAB308, #F59E0B)",
    glow: "rgba(234, 179, 8, 0.15)",
  },
  Alex: {
    avatar: "linear-gradient(135deg, #EF4444, #F87171)",
    border: "linear-gradient(90deg, #EF4444, #F87171)",
    glow: "rgba(239, 68, 68, 0.15)",
  },
};

const CUSTOM_AVATARS: Record<string, string> = {
  Alfred: "/avatars/alfred.jpg",
  Alex: "/avatars/alex.jpg",
  "Andrés": "/avatars/andres.jpg",
  Marina: "/avatars/marina.jpg",
  Roberto: "/avatars/roberto.jpg",
  Arturo: "/avatars/arturo.jpg",
};

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const secs = Math.round(diffMs / 1000);
  if (secs < 60) return "Hace menos de 1 min";
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.round(hours / 24)}d`;
}

function truncate(text: string, max: number): string {
  if (!text) return "";
  return text.length > max ? text.slice(0, max) + "..." : text;
}

export default function AgentCard({ name, role, model, status, onConfigure }: AgentCardProps) {
  const isWorking = status.status === "working";
  const isError = status.status === "error";
  const colors = GRADIENTS[name] || GRADIENTS.Alfred;
  const initial = name.charAt(0);

  return (
    <div
      className={`rounded-xl flex flex-col transition-all duration-300 ${isWorking ? "agent-card-working" : ""}`}
      style={{
        background: "rgba(20, 20, 22, 0.8)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: isWorking
          ? "1px solid rgba(34, 197, 94, 0.3)"
          : isError
          ? "1px solid rgba(239, 68, 68, 0.3)"
          : "1px solid rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
      }}
    >
      {/* Gradient top accent */}
      <div
        style={{
          height: 2,
          background: colors.border,
        }}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              {CUSTOM_AVATARS[name] ? (
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
                  style={{
                    boxShadow: isWorking
                      ? `0 0 16px ${colors.glow}`
                      : "none",
                    transition: "box-shadow 0.3s",
                  }}
                >
                  <Image
                    src={CUSTOM_AVATARS[name]}
                    alt={name}
                    width={44}
                    height={44}
                    className="rounded-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white text-base"
                  style={{
                    background: colors.avatar,
                    boxShadow: isWorking
                      ? `0 0 16px ${colors.glow}`
                      : "none",
                    transition: "box-shadow 0.3s",
                  }}
                >
                  {initial}
                </div>
              )}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
                  isWorking
                    ? "bg-emerald-400 animate-pulse"
                    : isError
                    ? "bg-red-500"
                    : "bg-zinc-600"
                }`}
                style={{ borderColor: "rgba(20, 20, 22, 0.8)" }}
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{name}</h3>
              <p className="text-[11px] text-zinc-500">{role}</p>
            </div>
          </div>
        </div>

        {/* Status rows */}
        <div className="space-y-2.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Estado</span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                isWorking
                  ? "text-emerald-400 bg-emerald-400/10"
                  : isError
                  ? "text-red-400 bg-red-400/10"
                  : "text-zinc-500 bg-zinc-800/50"
              }`}
            >
              {isWorking ? "Trabajando" : isError ? "Error" : "Idle"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Modelo</span>
            <span className="text-[11px] text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded">
              {model}
            </span>
          </div>

          {status.lastActivityDescription && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Ultima accion</span>
              <span
                className="text-[11px] text-zinc-400 truncate max-w-[140px]"
                title={status.lastActivityDescription}
              >
                {status.lastActivityDescription}
              </span>
            </div>
          )}

          {status.lastActivity && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Hace</span>
              <span className="text-[11px] text-zinc-500">{timeAgo(status.lastActivity)}</span>
            </div>
          )}

          {/* Tasks */}
          <div className="pt-2.5 mt-2.5 border-t border-zinc-800/50 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Ultima tarea</p>
                {status.lastTaskTitle ? (
                  <>
                    <p className="text-[11px] text-zinc-300 truncate" title={status.lastTaskTitle}>
                      {truncate(status.lastTaskTitle, 40)}
                    </p>
                    {status.lastTaskCompletedAt && (
                      <p className="text-[9px] text-zinc-600">{timeAgo(status.lastTaskCompletedAt)}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[11px] text-zinc-600">Sin tareas</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Proxima tarea</p>
                {status.nextTaskTitle ? (
                  <p className="text-[11px] text-zinc-300 truncate" title={status.nextTaskTitle}>
                    {truncate(status.nextTaskTitle, 40)}
                  </p>
                ) : (
                  <p className="text-[11px] text-zinc-600">Sin tareas</p>
                )}
              </div>
            </div>
          </div>

          {status.interactionCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">Interacciones</span>
              <span className="text-[11px] font-mono text-zinc-400">{status.interactionCount}</span>
            </div>
          )}
        </div>

        {/* Configure button */}
        {onConfigure && (
          <button
            onClick={onConfigure}
            className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-blue-400 border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all duration-200"
          >
            <FileEdit size={13} />
            Editar archivos
          </button>
        )}
      </div>
    </div>
  );
}

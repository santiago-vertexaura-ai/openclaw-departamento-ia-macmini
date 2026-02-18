"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Pause,
  RefreshCw,
  Shield,
  Search,
  FileText,
  AlertTriangle,
} from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  schedule: {
    kind: "at" | "every" | "cron";
    everyMs?: number;
    cron?: string;
    expr?: string;
    tz?: string;
    at?: string;
  };
  sessionTarget: string;
  payload: {
    kind: string;
    message?: string;
    text?: string;
    model?: string;
  };
  delivery?: {
    mode: string;
    channel?: string;
  };
  state: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastStatus?: string;
    lastDurationMs?: number;
    lastError?: string;
  };
}

const ICON_MAP: Record<string, typeof Clock> = {
  research: Search,
  briefing: FileText,
  security: Shield,
};

function getJobIcon(id: string) {
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (id.toLowerCase().includes(key)) return Icon;
  }
  return Clock;
}

function formatSchedule(schedule: CronJob["schedule"]): string {
  if (schedule.kind === "every" && schedule.everyMs) {
    const hours = schedule.everyMs / 3600000;
    if (hours >= 1) return `Cada ${hours}h`;
    const mins = schedule.everyMs / 60000;
    return `Cada ${mins} min`;
  }
  if (schedule.kind === "cron" && (schedule.expr || schedule.cron)) {
    const cronExpr = schedule.expr || schedule.cron;
    return `Cron: ${cronExpr}${schedule.tz ? ` (${schedule.tz})` : ""}`;
  }
  if (schedule.kind === "at" && schedule.at) {
    return `Una vez: ${schedule.at}`;
  }
  return "Desconocido";
}

function formatTimestamp(ms?: number): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(ms));
}

function formatRelativeTime(ms?: number): string {
  if (!ms) return "";
  const now = Date.now();
  const diffMs = ms - now;

  if (diffMs < 0) {
    const ago = Math.abs(diffMs);
    if (ago < 60000) return "hace menos de 1 min";
    if (ago < 3600000) return `hace ${Math.round(ago / 60000)} min`;
    if (ago < 86400000) return `hace ${Math.round(ago / 3600000)}h`;
    return `hace ${Math.round(ago / 86400000)}d`;
  }

  if (diffMs < 60000) return "en menos de 1 min";
  if (diffMs < 3600000) return `en ${Math.round(diffMs / 60000)} min`;
  if (diffMs < 86400000) return `en ${Math.round(diffMs / 3600000)}h`;
  return `en ${Math.round(diffMs / 86400000)}d`;
}

const ICON_COLORS: Record<string, string> = {
  research: "#3B82F6",
  briefing: "#22C55E",
  security: "#F59E0B",
};

function getIconColor(id: string): string {
  for (const [key, color] of Object.entries(ICON_COLORS)) {
    if (id.toLowerCase().includes(key)) return color;
  }
  return "#3B82F6";
}

export default function CronJobsPanel() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/cron?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
        }
      } catch (e) {
        console.error("Error loading cron jobs:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-sm text-zinc-500">Cargando cron jobs...</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return <p className="text-sm text-zinc-500">No hay cron jobs configurados</p>;
  }

  const activeCount = jobs.filter((j) => j.enabled).length;

  return (
    <div className="h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h3 className="text-xl font-bold text-zinc-100">Cron Jobs</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
          {activeCount} activos
        </span>
      </div>

      {/* Jobs */}
      <div className="space-y-3">
        {jobs.map((job) => {
          const Icon = getJobIcon(job.id);
          const iconColor = getIconColor(job.id);
          const isError = job.state.lastStatus === "error";

          return (
            <div
              key={job.id}
              className="bg-[#141416] border border-[#27272A] rounded-xl p-4 hover:border-[#3F3F46] transition-all duration-200"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${iconColor}15` }}
                  >
                    <Icon size={18} style={{ color: iconColor }} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-100">
                      {job.name}
                    </h4>
                    {job.description && (
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {job.description}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  {job.enabled ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500 bg-[#1C1C1F] px-2.5 py-1 rounded-full">
                      <Pause size={10} />
                      Pausado
                    </span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#0A0A0B] rounded-lg p-2.5">
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold mb-1">
                    Frecuencia
                  </p>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {formatSchedule(job.schedule)}
                  </p>
                </div>
                <div className="bg-[#0A0A0B] rounded-lg p-2.5">
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold mb-1">
                    Sesion
                  </p>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {job.sessionTarget === "isolated" ? "Aislada" : "Principal"}
                    {job.payload.model && (
                      <span className="text-zinc-500 ml-1">
                        ({job.payload.model})
                      </span>
                    )}
                  </p>
                </div>
                <div className="bg-[#0A0A0B] rounded-lg p-2.5">
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold mb-1">
                    Ultima ejecucion
                  </p>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {job.state.lastRunAtMs
                      ? formatTimestamp(job.state.lastRunAtMs)
                      : "Nunca"}
                  </p>
                  {job.state.lastRunAtMs && (
                    <p className="text-[9px] text-zinc-600 mt-0.5">
                      {formatRelativeTime(job.state.lastRunAtMs)}
                      {job.state.lastDurationMs &&
                        ` · ${(job.state.lastDurationMs / 1000).toFixed(1)}s`}
                    </p>
                  )}
                  {job.state.lastStatus && (
                    <span
                      className={`text-[9px] font-bold ${
                        isError ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {job.state.lastStatus === "ok"
                        ? "OK"
                        : job.state.lastStatus === "error"
                          ? "ERROR"
                          : job.state.lastStatus}
                    </span>
                  )}
                </div>
                <div className="bg-[#0A0A0B] rounded-lg p-2.5">
                  <p className="text-[9px] text-zinc-600 uppercase font-semibold mb-1">
                    Proxima ejecucion
                  </p>
                  <p className="text-[11px] text-zinc-300 font-medium">
                    {job.state.nextRunAtMs
                      ? formatTimestamp(job.state.nextRunAtMs)
                      : "—"}
                  </p>
                  {job.state.nextRunAtMs && (
                    <p className="text-[9px] text-zinc-600 mt-0.5">
                      {formatRelativeTime(job.state.nextRunAtMs)}
                    </p>
                  )}
                </div>
              </div>

              {/* Delivery */}
              {job.delivery && (
                <div className="mt-2.5 flex items-center gap-1.5">
                  <RefreshCw size={10} className="text-zinc-600" />
                  <span className="text-[9px] text-zinc-600">
                    Entrega: {job.delivery.mode} via{" "}
                    {job.delivery.channel || "default"}
                  </span>
                </div>
              )}

              {/* Error */}
              {job.state.lastError && (
                <div className="mt-2.5 bg-red-500/8 border border-red-500/15 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertTriangle
                    size={12}
                    className="text-red-400 flex-shrink-0 mt-0.5"
                  />
                  <p className="text-[11px] text-red-300">
                    {job.state.lastError}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

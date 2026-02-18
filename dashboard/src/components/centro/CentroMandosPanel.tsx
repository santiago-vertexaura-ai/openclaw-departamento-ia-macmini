"use client";

import { useState, useEffect } from "react";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";
import AgentCard from "./AgentCard";
import ActivityFeed from "./ActivityFeed";
import AgentConfigEditor from "./AgentConfigEditor";
import SystemHealth from "./SystemHealth";
import { CheckCircle, FileText, Star, Users, Zap } from "lucide-react";

interface KPIData {
  tasksCompletedWeek: number;
  docsCreatedWeek: number;
  avgRating: number | null;
}

interface CentroMandosPanelProps {
  agents: AllAgentsStatus;
}

export default function CentroMandosPanel({ agents }: CentroMandosPanelProps) {
  const [kpis, setKpis] = useState<KPIData>({
    tasksCompletedWeek: 0,
    docsCreatedWeek: 0,
    avgRating: null,
  });
  const [configEditor, setConfigEditor] = useState<{
    agent: "alfred" | "roberto" | "andres" | "marina" | "arturo" | "alex";
    label: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/kpis?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          setKpis({
            tasksCompletedWeek: data.tasksCompletedWeek ?? 0,
            docsCreatedWeek: data.docsCreatedWeek ?? 0,
            avgRating: data.avgRating ?? null,
          });
        }
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 120000);
    return () => clearInterval(id);
  }, []);

  const activeAgents = [agents.alfred, agents.roberto, agents.andres, agents.marina, agents.arturo, agents.alex].filter(
    (a) => a?.status === "working"
  ).length;

  const KPI_ITEMS = [
    {
      label: "Tareas semana",
      value: kpis.tasksCompletedWeek.toString(),
      Icon: CheckCircle,
      color: "#22C55E",
    },
    {
      label: "Docs semana",
      value: kpis.docsCreatedWeek.toString(),
      Icon: FileText,
      color: "#3B82F6",
    },
    {
      label: "Agentes activos",
      value: `${activeAgents}/6`,
      Icon: Users,
      color: activeAgents > 0 ? "#10B981" : "#71717A",
    },
    {
      label: "Rating medio",
      value: kpis.avgRating ? kpis.avgRating.toFixed(1) : "—",
      Icon: Star,
      color: "#A855F7",
    },
  ];

  return (
    <div className="h-full flex gap-5">
      {/* Left column: KPIs + Equipo */}
      <div className="flex-1 overflow-y-auto pr-1 min-w-0">
        {/* KPI Bar — 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {KPI_ITEMS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-[#27272A] p-3.5 flex items-center gap-3 hover:border-[#3F3F46] transition-all duration-200"
              style={{ background: "#141416" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: `${kpi.color}15` }}
              >
                <kpi.Icon size={16} style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-lg font-bold text-zinc-100">{kpi.value}</p>
                <p className="text-[9px] text-zinc-500 uppercase tracking-wide">
                  {kpi.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* System Health + Quick Actions row */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <SystemHealth />
          <div className="rounded-xl border border-[#27272A] p-4" style={{ background: "#141416" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-zinc-500" />
              <h3 className="text-xs font-semibold text-zinc-400">Acciones</h3>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setConfigEditor({ agent: "roberto", label: "Roberto" })}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-[#0A0A0B] hover:bg-[#1C1C1F] px-3 py-2 rounded-lg transition-all text-left"
              >
                Configurar agentes
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("switchTab", { detail: "tasks" }))}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-[#0A0A0B] hover:bg-[#1C1C1F] px-3 py-2 rounded-lg transition-all text-left"
              >
                Nueva tarea
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("switchTab", { detail: "vault" }))}
                className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 bg-[#0A0A0B] hover:bg-[#1C1C1F] px-3 py-2 rounded-lg transition-all text-left"
              >
                Abrir Vault
              </button>
            </div>
          </div>
        </div>

        {/* SECTION: Equipo */}
        <div>
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <Users size={15} className="text-zinc-500" />
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Equipo
            </h2>
            {activeAgents > 0 && (
              <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {activeAgents} activo{activeAgents > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            <AgentCard
              name="Alfred"
              role="Orquestador"
              model="Sonnet 4.5"
              status={agents.alfred}
              onConfigure={() =>
                setConfigEditor({ agent: "alfred", label: "Alfred" })
              }
            />
            <AgentCard
              name="Roberto"
              role="Investigador"
              model="Haiku 4.5"
              status={agents.roberto}
              onConfigure={() =>
                setConfigEditor({ agent: "roberto", label: "Roberto" })
              }
            />
            <AgentCard
              name="Andrés"
              role="Content Intelligence"
              model="Haiku 4.5"
              status={agents.andres}
              onConfigure={() =>
                setConfigEditor({ agent: "andres", label: "Andrés" })
              }
            />
            <AgentCard
              name="Marina"
              role="Content Creator"
              model="GLM 4.7 Flash"
              status={agents.marina}
              onConfigure={() =>
                setConfigEditor({ agent: "marina", label: "Marina" })
              }
            />
            <AgentCard
              name="Arturo"
              role="Performance Manager"
              model="GLM 4.7 Flash"
              status={agents.arturo}
              onConfigure={() =>
                setConfigEditor({ agent: "arturo", label: "Arturo" })
              }
            />
            <AgentCard
              name="Alex"
              role="Sales Strategist"
              model="GLM 4.7 Flash"
              status={agents.alex}
              onConfigure={() =>
                setConfigEditor({ agent: "alex", label: "Alex" })
              }
            />
          </div>
        </div>
      </div>

      {/* Right column: Activity Feed — full height */}
      <div className="w-[380px] flex-shrink-0 flex flex-col min-h-0">
        <ActivityFeed />
      </div>

      {/* Config Editor Modal */}
      {configEditor && (
        <AgentConfigEditor
          agent={configEditor.agent}
          agentLabel={configEditor.label}
          onClose={() => setConfigEditor(null)}
        />
      )}
    </div>
  );
}

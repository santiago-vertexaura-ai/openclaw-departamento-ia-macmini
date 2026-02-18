"use client";

import { LayoutDashboard, MessageSquare, ClipboardList, Clock, BookOpen, Monitor, Brain, Share2 } from "lucide-react";
import CronJobsPanel from "@/components/CronJobsPanel";
import KanbanBoard from "@/components/tasks/KanbanBoard";
import DocsPanel from "@/components/docs/DocsPanel";
import CentroMandosPanel from "@/components/centro/CentroMandosPanel";
import ChatPanel from "@/components/chat/ChatPanel";
import OfficeCanvas3D from "@/components/oficina/OfficeCanvas3D";
import VaultPanel from "@/components/vault/VaultPanel";
import SocialPanel from "@/components/social/SocialPanel";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useState, useEffect } from "react";

type Tab = "centro" | "chat" | "tasks" | "cron" | "docs" | "oficina" | "vault" | "social";

export default function Home() {
  const agents = useAgentStatus(2000);
  const [activeTab, setActiveTab] = useState<Tab>("centro");

  // Listen for tab switch events from child components (quick actions)
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail as Tab;
      if (tab) setActiveTab(tab);
    };
    window.addEventListener("switchTab", handler);
    return () => window.removeEventListener("switchTab", handler);
  }, []);

  const alfredWorking = agents.alfred?.status === "working";
  const robertoWorking = agents.roberto?.status === "working";
  const andresWorking = agents.andres?.status === "working";
  const marinaWorking = agents.marina?.status === "working";
  const anyWorking = alfredWorking || robertoWorking || andresWorking || marinaWorking;

  function timeAgo(isoDate: string): string {
    if (!isoDate) return "";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const secs = Math.round(diffMs / 1000);
    if (secs < 60) return "Hace menos de 1 min";
    const mins = Math.round(diffMs / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.round(mins / 60);
    return `Hace ${hours}h`;
  }

  const lastActivity = agents.alfred?.lastActivity || "";

  const TABS: { key: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
    { key: "centro", label: "Centro de Mandos", Icon: LayoutDashboard },
    { key: "chat", label: "Chat", Icon: MessageSquare },
    { key: "tasks", label: "Tareas", Icon: ClipboardList },
    { key: "cron", label: "Cron Jobs", Icon: Clock },
    { key: "docs", label: "Docs", Icon: BookOpen },
    { key: "oficina", label: "Oficina", Icon: Monitor },
    { key: "vault", label: "Vault", Icon: Brain },
    { key: "social", label: "Social", Icon: Share2 },
  ];

  return (
    <div className="flex h-screen" style={{ background: "#0A0A0B" }}>
      {/* Sidebar */}
      <div className="w-56 bg-[#0A0A0B] border-r border-[#1C1C1F] flex flex-col">
        {/* Header - Avatar + Status */}
        <div className="p-5 border-b border-[#1C1C1F]">
          <div className="flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-full border-2 mb-2.5 transition-all duration-300 flex items-center justify-center ${
                anyWorking
                  ? "border-emerald-400 shadow-lg shadow-emerald-400/30 animate-spin-ring"
                  : "border-[#27272A]"
              }`}
              style={{ background: "#141416" }}
            >
              <span className="text-lg">A</span>
            </div>
            <h2 className="text-base font-bold text-zinc-100">Alfred</h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  alfredWorking
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-zinc-600"
                }`}
              />
              <span
                className={`text-[10px] font-semibold ${
                  alfredWorking ? "text-emerald-400" : "text-zinc-500"
                }`}
              >
                {alfredWorking ? "Trabajando..." : "Descansando"}
              </span>
            </div>
            {robertoWorking && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-purple-400">
                  Roberto activo
                </span>
              </div>
            )}
            {andresWorking && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-orange-400">
                  Andrés activo
                </span>
              </div>
            )}
            {marinaWorking && (
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-pink-400">
                  Marina activa
                </span>
              </div>
            )}
            {lastActivity && (
              <p className="text-[9px] text-zinc-600 mt-1">
                {timeAgo(lastActivity)}
              </p>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2.5 ${
                    isActive
                      ? "bg-blue-500/10 border-l-2 border-blue-500 text-zinc-100"
                      : "text-zinc-500 hover:bg-[#141416] hover:text-zinc-300 border-l-2 border-transparent"
                  }`}
                >
                  <tab.Icon size={16} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Version */}
        <div className="p-3 border-t border-[#1C1C1F]">
          <p className="text-[9px] text-zinc-700 text-center">v0.4.0</p>
        </div>
      </div>

      {/* Main Panel — stacked with absolute positioning to preserve state */}
      <div className="flex-1 overflow-hidden relative">
        <div style={{ display: activeTab === "centro" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <CentroMandosPanel agents={agents} />
          </div>
        </div>
        <div style={{ display: activeTab === "chat" ? "block" : "none" }} className="absolute inset-0">
          <ChatPanel />
        </div>
        <div style={{ display: activeTab === "tasks" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <KanbanBoard />
          </div>
        </div>
        <div style={{ display: activeTab === "cron" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <CronJobsPanel />
          </div>
        </div>
        <div style={{ display: activeTab === "docs" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <DocsPanel />
          </div>
        </div>
        <div style={{ display: activeTab === "oficina" ? "block" : "none" }} className="absolute inset-0 overflow-hidden">
          {activeTab === "oficina" && <OfficeCanvas3D agents={agents} />}
        </div>
        <div style={{ display: activeTab === "vault" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <VaultPanel />
          </div>
        </div>
        <div style={{ display: activeTab === "social" ? "block" : "none" }} className="absolute inset-0 p-6 overflow-hidden">
          <div className="h-full">
            <SocialPanel />
          </div>
        </div>
      </div>

    </div>
  );
}

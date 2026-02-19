"use client";

import { useEffect, useState } from "react";
import { useDocumentVisible } from "./useVisibility";

export interface AgentStatusData {
  status: "idle" | "working" | "error";
  lastActivity: string;
  lastActivityDescription: string;
  lastCost: number;
  lastModel: string;
  totalCostToday: number;
  totalCostMonth: number;
  totalCostAll: number;
  interactionCount: number;
  lastTaskTitle?: string;
  lastTaskCompletedAt?: string;
  nextTaskTitle?: string;
}

export interface AllAgentsStatus {
  alfred: AgentStatusData;
  roberto: AgentStatusData;
  andres: AgentStatusData;
  marina: AgentStatusData;
  arturo: AgentStatusData;
  alex: AgentStatusData;
}

const DEFAULT_AGENT: AgentStatusData = {
  status: "idle",
  lastActivity: "",
  lastActivityDescription: "",
  lastCost: 0,
  lastModel: "",
  totalCostToday: 0,
  totalCostMonth: 0,
  totalCostAll: 0,
  interactionCount: 0,
};

export function useAgentStatus(intervalMs = 5000) {
  const visible = useDocumentVisible();
  const [agents, setAgents] = useState<AllAgentsStatus>({
    alfred: { ...DEFAULT_AGENT },
    roberto: { ...DEFAULT_AGENT },
    andres: { ...DEFAULT_AGENT },
    marina: { ...DEFAULT_AGENT },
    arturo: { ...DEFAULT_AGENT },
    alex: { ...DEFAULT_AGENT },
  });

  useEffect(() => {
    if (!visible) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/status?t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.alfred) {
          setAgents(data);
        } else {
          setAgents({
            alfred: {
              status: data.status === "working" ? "working" : "idle",
              lastActivity: data.lastActivity || "",
              lastActivityDescription: data.lastActivityDescription || data.currentActivity || "",
              lastCost: data.lastCost || 0,
              lastModel: data.lastModel || "",
              totalCostToday: 0,
              totalCostMonth: 0,
              totalCostAll: data.totalCost || 0,
              interactionCount: data.interactionCount || 0,
            },
            roberto: { ...DEFAULT_AGENT },
            andres: { ...DEFAULT_AGENT },
            marina: { ...DEFAULT_AGENT },
            arturo: { ...DEFAULT_AGENT },
            alex: { ...DEFAULT_AGENT },
          });
        }
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, visible]);

  return agents;
}

"use client";

import { useRef, useCallback, useEffect } from "react";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";
import {
  IDLE_POS_3D, WANDER_POINTS_3D, SANTI_WANDER_3D,
  CONF_SEATS_3D, deskSitPos, type Pos3D,
} from "./office-layout-3d";
import { AGENT_IDS } from "./office-constants-3d";

// ── Agent state ──
export interface AgentState3D {
  x: number; z: number;
  targetX: number; targetZ: number;
  status: "idle" | "working" | "error";
  walkFrame: number;
  typingFrame: number;
  breathOffset: number;
  idleAction: number;
  wanderTimer: number;
  wanderPause: number;
}

function makeAgent(pos: Pos3D): AgentState3D {
  return {
    x: pos.x, z: pos.z,
    targetX: pos.x, targetZ: pos.z,
    status: "idle",
    walkFrame: 0, typingFrame: 0,
    breathOffset: Math.random() * 100,
    idleAction: 0,
    wanderTimer: Math.floor(30 + Math.random() * 60),
    wanderPause: 0,
  };
}

export interface StandupData {
  active: boolean;
  agents: string[];
}

// Pre-compute initial states (module level, runs once)
function initStates(): Record<string, AgentState3D> {
  const states: Record<string, AgentState3D> = {};
  for (const id of AGENT_IDS) {
    states[id] = makeAgent(IDLE_POS_3D[id]);
  }
  return states;
}

export function useAgentMovement(agents: AllAgentsStatus) {
  const stateRef = useRef<Record<string, AgentState3D>>(initStates());

  const frameRef = useRef(0);
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  // ── Standup detection ──
  const standupRef = useRef<StandupData>({ active: false, agents: [] });

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/standup-status");
        if (res.ok) {
          const data = await res.json();
          const active = !!data.active;
          const involved = Array.isArray(data.agents) ? data.agents as string[] : [];
          standupRef.current = { active, agents: active ? [...involved, "santi"] : [] };
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Movement tick (called every frame via useFrame) ──
  const tick = useCallback(() => {
    frameRef.current++;
    const st = stateRef.current;
    const ag = agentsRef.current;
    const standup = standupRef.current;

    for (const id of AGENT_IDS) {
      const s = st[id];
      const isSanti = id === "santi";
      const ns = isSanti ? "idle" : (ag[id as keyof typeof ag]?.status || "idle");

      // ── Standup override ──
      const inStandup = standup.active && standup.agents.includes(id);
      if (inStandup && CONF_SEATS_3D[id]) {
        s.status = "working";
        s.targetX = CONF_SEATS_3D[id].x;
        s.targetZ = CONF_SEATS_3D[id].z;
      } else if (s.status !== ns) {
        s.status = ns;
        if (ns === "working" || ns === "error") {
          const sit = deskSitPos(id);
          s.targetX = sit.x;
          s.targetZ = sit.z;
          s.wanderPause = 0;
        } else {
          s.targetX = IDLE_POS_3D[id].x;
          s.targetZ = IDLE_POS_3D[id].z;
          s.wanderTimer = Math.floor(90 + Math.random() * 120);
        }
      }

      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.2) {
        const speed = isSanti ? 0.10 : 0.15; // units per frame
        s.x += (dx / dist) * speed;
        s.z += (dz / dist) * speed;
        if (frameRef.current % 8 === 0) s.walkFrame = (s.walkFrame + 1) % 2;
        s.wanderPause = 0;
      } else {
        s.x = s.targetX;
        s.z = s.targetZ;
        s.walkFrame = 0;

        if ((s.status === "working" || s.status === "error") && frameRef.current % 10 === 0) {
          s.typingFrame = (s.typingFrame + 1) % 2;
        }

        // ── Idle wandering ──
        if (s.status === "idle") {
          if (s.wanderPause > 0) {
            s.wanderPause--;
            if (frameRef.current % 90 === 0) {
              s.idleAction = (s.idleAction + 1) % 3;
            }
          } else {
            s.wanderTimer--;
            if (s.wanderTimer <= 0) {
              const points = isSanti ? SANTI_WANDER_3D : WANDER_POINTS_3D;
              const pt = points[Math.floor(Math.random() * points.length)];
              s.targetX = pt.x + (Math.random() - 0.5) * 2;
              s.targetZ = pt.z + (Math.random() - 0.5) * 2;
              s.wanderPause = Math.floor(30 + Math.random() * 60);
              s.wanderTimer = Math.floor(90 + Math.random() * 120);
            }
          }
        }
      }
    }
  }, []);

  return { stateRef, frameRef, tick, standupRef };
}

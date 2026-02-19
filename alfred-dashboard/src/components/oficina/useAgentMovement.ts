"use client";

import { useRef, useCallback, useEffect } from "react";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";
import {
  IDLE_POS_3D, WANDER_POINTS_3D, SANTI_WANDER_3D,
  CONF_SEATS_3D, deskSitPos, type Pos3D,
} from "./office-layout-3d";
import { AGENT_IDS } from "./office-constants-3d";

// ── Interaction types ──
export type InteractionType = "chat" | "coffee" | "supervise" | null;

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
  facing: number;
  // Interactions
  interaction: InteractionType;
  interactionPartner: string | null;
  interactionTimer: number; // frames remaining
}

// Kitchen waypoint for coffee interactions
const KITCHEN_COFFEE_SPOT: Pos3D = { x: -40.5, z: 23.2 }; // near coffee machine
const KITCHEN_COFFEE_SPOT_2: Pos3D = { x: -38, z: 23.2 }; // second spot nearby

// Kitchen room bounds (from ROOMS_3D.kitchen: x=-53.5, z=8.2, w=29, d=25.6)
const KITCHEN_BOUNDS = { xMin: -53.5, xMax: -24.5, zMin: 8.2, zMax: 33.8 };

// 3 hours in milliseconds
const COFFEE_COOLDOWN_MS = 3 * 60 * 60 * 1000;

function isInKitchen(s: AgentState3D): boolean {
  return s.x >= KITCHEN_BOUNDS.xMin && s.x <= KITCHEN_BOUNDS.xMax
    && s.z >= KITCHEN_BOUNDS.zMin && s.z <= KITCHEN_BOUNDS.zMax;
}

function isStopped(s: AgentState3D): boolean {
  return Math.abs(s.x - s.targetX) <= 0.3 && Math.abs(s.z - s.targetZ) <= 0.3;
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
    facing: 0,
    interaction: null,
    interactionPartner: null,
    interactionTimer: 0,
  };
}

export interface StandupData {
  active: boolean;
  agents: string[];
}

function initStates(): Record<string, AgentState3D> {
  const states: Record<string, AgentState3D> = {};
  for (const id of AGENT_IDS) {
    states[id] = makeAgent(IDLE_POS_3D[id]);
  }
  return states;
}

// Distance between two agents
function agentDist(a: AgentState3D, b: AgentState3D): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

// Face agent toward a point
function faceToward(s: AgentState3D, tx: number, tz: number) {
  const dx = tx - s.x;
  const dz = tz - s.z;
  const targetAngle = Math.atan2(dx, dz);
  let diff = targetAngle - s.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  s.facing += diff * 0.15;
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

  // ── Interaction cooldown (prevent spamming) ──
  const interactionCooldownRef = useRef<Record<string, number>>({});

  // ── Coffee cooldown: real-time, once per 3 hours ──
  const lastCoffeeTimeRef = useRef<number>(0);

  // ── Movement tick ──
  const tick = useCallback(() => {
    frameRef.current++;
    const frame = frameRef.current;
    const st = stateRef.current;
    const ag = agentsRef.current;
    const standup = standupRef.current;
    const cooldowns = interactionCooldownRef.current;

    // ── Phase 1: Status updates + movement ──
    for (const id of AGENT_IDS) {
      const s = st[id];
      const isSanti = id === "santi";
      const ns = isSanti ? "idle" : (ag[id as keyof typeof ag]?.status || "idle");

      // Standup override
      const inStandup = standup.active && standup.agents.includes(id);
      if (inStandup && CONF_SEATS_3D[id]) {
        s.status = "working";
        s.targetX = CONF_SEATS_3D[id].x;
        s.targetZ = CONF_SEATS_3D[id].z;
        s.interaction = null;
        s.interactionPartner = null;
      } else if (s.interaction) {
        // If in interaction, don't change status — let interaction timer handle it
        s.interactionTimer--;
        if (s.interactionTimer <= 0) {
          // End interaction
          const partnerId = s.interactionPartner;
          s.interaction = null;
          s.interactionPartner = null;
          cooldowns[id] = frame + 300; // 5 second cooldown (~300 frames)
          // Also end partner's interaction
          if (partnerId && st[partnerId]) {
            st[partnerId].interaction = null;
            st[partnerId].interactionPartner = null;
            cooldowns[partnerId] = frame + 300;
          }
          // Resume wandering
          s.wanderTimer = Math.floor(30 + Math.random() * 60);
        } else {
          // During interaction: face partner
          if (s.interactionPartner && st[s.interactionPartner]) {
            faceToward(s, st[s.interactionPartner].x, st[s.interactionPartner].z);
          }
        }
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

      // Movement
      const dx = s.targetX - s.x;
      const dz = s.targetZ - s.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.2) {
        const speed = isSanti ? 0.04 : 0.06;
        s.x += (dx / dist) * speed;
        s.z += (dz / dist) * speed;
        if (frame % 8 === 0) s.walkFrame = (s.walkFrame + 1) % 2;
        s.wanderPause = 0;
        if (!s.interaction) {
          const targetAngle = Math.atan2(dx, dz);
          let diff = targetAngle - s.facing;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          s.facing += diff * 0.15;
        }
      } else {
        s.x = s.targetX;
        s.z = s.targetZ;
        s.walkFrame = 0;

        if ((s.status === "working" || s.status === "error") && frame % 10 === 0) {
          s.typingFrame = (s.typingFrame + 1) % 2;
        }

        // Idle wandering (only if not in interaction)
        if (s.status === "idle" && !s.interaction) {
          if (s.wanderPause > 0) {
            s.wanderPause--;
            if (frame % 90 === 0) {
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

    // ── Phase 2: Interaction detection (every 60 frames ≈ 1 second) ──
    if (frame % 60 === 0) {
      const idleAgents = AGENT_IDS.filter(
        (id) => st[id].status === "idle" && !st[id].interaction && (cooldowns[id] || 0) < frame
      );

      // Chat: two idle agents that stopped near each other (<8 units)
      for (let i = 0; i < idleAgents.length; i++) {
        const a = idleAgents[i];
        const sa = st[a];
        if (sa.interaction) continue;
        // Must be stopped (at target)
        if (Math.abs(sa.x - sa.targetX) > 0.3 || Math.abs(sa.z - sa.targetZ) > 0.3) continue;

        for (let j = i + 1; j < idleAgents.length; j++) {
          const b = idleAgents[j];
          const sb = st[b];
          if (sb.interaction) continue;
          if (Math.abs(sb.x - sb.targetX) > 0.3 || Math.abs(sb.z - sb.targetZ) > 0.3) continue;

          if (agentDist(sa, sb) < 8 && Math.random() < 0.3) {
            // Start chat
            sa.interaction = "chat";
            sa.interactionPartner = b;
            sa.interactionTimer = 180 + Math.floor(Math.random() * 120); // 3-5 seconds
            sb.interaction = "chat";
            sb.interactionPartner = a;
            sb.interactionTimer = sa.interactionTimer;
            break;
          }
        }
      }

      // Coffee: only 2 agents, only once per 3h real time, only when stopped in kitchen
      const now = Date.now();
      const coffeeCooldownOk = now - lastCoffeeTimeRef.current >= COFFEE_COOLDOWN_MS;
      const anyoneCoffee = AGENT_IDS.some((id) => st[id].interaction === "coffee");
      if (coffeeCooldownOk && !anyoneCoffee && Math.random() < 0.15) {
        // Find 2 idle non-Santi agents that are stopped inside the kitchen
        const kitchenIdlers = idleAgents.filter(
          (id) => id !== "santi" && !st[id].interaction && isStopped(st[id]) && isInKitchen(st[id])
        );
        if (kitchenIdlers.length >= 2) {
          const a = kitchenIdlers[0];
          const b = kitchenIdlers[1];
          const sa = st[a];
          const sb = st[b];
          sa.interaction = "coffee";
          sa.interactionPartner = b;
          sa.interactionTimer = 300; // 5 seconds
          sa.targetX = KITCHEN_COFFEE_SPOT.x;
          sa.targetZ = KITCHEN_COFFEE_SPOT.z;
          sb.interaction = "coffee";
          sb.interactionPartner = a;
          sb.interactionTimer = 300;
          sb.targetX = KITCHEN_COFFEE_SPOT_2.x;
          sb.targetZ = KITCHEN_COFFEE_SPOT_2.z;
          lastCoffeeTimeRef.current = now;
        }
      }

      // Santi supervise: walks behind a random working agent
      const santi = st["santi"];
      if (santi && santi.status === "idle" && !santi.interaction && (cooldowns["santi"] || 0) < frame) {
        if (Math.random() < 0.08) { // 8% chance per second
          const workingAgents = AGENT_IDS.filter(
            (id) => id !== "santi" && st[id].status === "working"
          );
          if (workingAgents.length > 0) {
            const target = workingAgents[Math.floor(Math.random() * workingAgents.length)];
            const sit = deskSitPos(target);
            santi.interaction = "supervise";
            santi.interactionPartner = target;
            santi.interactionTimer = 180; // 3 seconds watching
            // Stand behind the worker (offset in Z)
            santi.targetX = sit.x;
            santi.targetZ = sit.z + 8; // behind the desk
          }
        }
      }
    }
  }, []);

  return { stateRef, frameRef, tick, standupRef };
}

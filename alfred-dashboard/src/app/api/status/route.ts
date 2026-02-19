import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const HOME = process.env.HOME || "/Users/alfredpifi";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AgentStatusData {
  status: "idle" | "working" | "error";
  lastActivity: string;
  lastActivityDescription: string;
  lastCost: number;
  lastModel: string;
  totalCostToday: number;
  totalCostMonth: number;
  totalCostAll: number;
  interactionCount: number;
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

// Cache for agent Supabase data (avoid querying every 2s)
let robertoCache: { data: Partial<AgentStatusData>; ts: number } | null = null;
let andresCache: { data: Partial<AgentStatusData>; ts: number } | null = null;
let marinaCache: { data: Partial<AgentStatusData>; ts: number } | null = null;
let arturoCache: { data: Partial<AgentStatusData>; ts: number } | null = null;
let alexCache: { data: Partial<AgentStatusData>; ts: number } | null = null;
const AGENT_CACHE_TTL = 60000; // 60s

const ACTION_LABELS: Record<string, string> = {
  task_started: "Iniciando tarea",
  task_completed: "Tarea completada",
  task_failed: "Tarea fallida",
  doc_created: "Documento generado",
  task_reset_stale: "Reset por timeout",
};

async function getAgentActivityData(agentId: string): Promise<Partial<AgentStatusData>> {
  const cache = agentId === "marina" ? marinaCache : agentId === "andres" ? andresCache : agentId === "arturo" ? arturoCache : agentId === "alex" ? alexCache : robertoCache;
  if (cache && Date.now() - cache.ts < AGENT_CACHE_TTL) {
    return cache.data;
  }

  try {
    const [lastActivity, countResult] = await Promise.all([
      supabase
        .from("agent_activity")
        .select("action, details, created_at")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("agent_activity")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agentId),
    ]);

    const result: Partial<AgentStatusData> = {};

    if (lastActivity.data?.[0]) {
      const act = lastActivity.data[0];
      result.lastActivity = act.created_at;
      result.lastActivityDescription =
        ACTION_LABELS[act.action] || act.action;
    }

    if (countResult.count !== null) {
      result.interactionCount = countResult.count;
    }

    const cacheEntry = { data: result, ts: Date.now() };
    if (agentId === "marina") {
      marinaCache = cacheEntry;
    } else if (agentId === "andres") {
      andresCache = cacheEntry;
    } else if (agentId === "arturo") {
      arturoCache = cacheEntry;
    } else if (agentId === "alex") {
      alexCache = cacheEntry;
    } else {
      robertoCache = cacheEntry;
    }
    return result;
  } catch {
    return {};
  }
}

// Cache for task data (avoid querying every 2s)
let taskCache: { data: Record<string, { lastTaskTitle?: string; lastTaskCompletedAt?: string; nextTaskTitle?: string }>; ts: number } | null = null;
const TASK_CACHE_TTL = 30000; // 30s

async function getAgentTasks(): Promise<Record<string, { lastTaskTitle?: string; lastTaskCompletedAt?: string; nextTaskTitle?: string }>> {
  if (taskCache && Date.now() - taskCache.ts < TASK_CACHE_TTL) {
    return taskCache.data;
  }

  const result: Record<string, { lastTaskTitle?: string; lastTaskCompletedAt?: string; nextTaskTitle?: string }> = {};
  const agents = ["alfred", "roberto", "andres", "marina", "arturo", "alex"];

  try {
    const [lastTasks, nextTasks] = await Promise.all([
      // Last completed task per agent (combined query, split later)
      supabase
        .from("agent_tasks")
        .select("assigned_to,title,completed_at")
        .eq("status", "completada")
        .order("completed_at", { ascending: false })
        .limit(20),
      // Next pending task per agent
      supabase
        .from("agent_tasks")
        .select("assigned_to,title")
        .eq("status", "pendiente")
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    for (const agentId of agents) {
      const last = lastTasks.data?.find((t) => t.assigned_to === agentId);
      const next = nextTasks.data?.find((t) => t.assigned_to === agentId);
      result[agentId] = {
        lastTaskTitle: last?.title,
        lastTaskCompletedAt: last?.completed_at,
        nextTaskTitle: next?.title,
      };
    }
  } catch {
    // ignore
  }

  taskCache = { data: result, ts: Date.now() };
  return result;
}

function getRealtimeStatus(agentId: string): { status: "working" | "idle"; lastActivityAt: string | null } {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const logFile = `/tmp/openclaw/openclaw-${today}.log`;

    if (!fs.existsSync(logFile)) return { status: "idle", lastActivityAt: null };

    const tail = execSync(`tail -300 "${logFile}"`, {
      encoding: "utf-8",
      timeout: 2000,
    });

    const allLines = tail.split("\n").filter(Boolean);

    // Track open runs: start increments, done decrements
    // A run is "open" if we see start but not done for a matching runId
    const openRuns = new Map<string, string>(); // runId → time
    let lastActivityAt: string | null = null;

    for (const line of allLines) {
      if (!line.includes("embedded run start") && !line.includes("embedded run done")) continue;

      let msg = "";
      let time = "";
      try {
        const parsed = JSON.parse(line);
        msg = parsed["1"] || "";
        time = parsed.time || parsed?._meta?.date || "";
      } catch {
        continue;
      }

      // Extract runId from message
      const runIdMatch = msg.match(/runId=(\S+)/);
      if (!runIdMatch) continue;
      const runId = runIdMatch[1];

      // Filter by agent
      if (agentId === "roberto") {
        if (!runId.includes("roberto-task-poll") && !runId.includes("roberto-ig-scan")) continue;
      } else if (agentId === "andres") {
        if (!runId.includes("andres-task-poll")) continue;
      } else if (agentId === "marina") {
        if (!runId.includes("marina-task-poll")) continue;
      } else if (agentId === "arturo") {
        if (!runId.includes("arturo-weekly-review") && !runId.includes("arturo-task-poll")) continue;
      } else if (agentId === "alex") {
        if (!runId.includes("alex-")) continue;
      } else {
        // Alfred: main agent runs — exclude announce/cron sub-runs and agent-specific runs
        if (runId.includes("roberto-task-poll") || runId.includes("andres-task-poll") || runId.includes("marina-task-poll") || runId.includes("roberto-ig-scan") || runId.includes("arturo-weekly-review") || runId.includes("arturo-task-poll")) continue;
        if (runId.startsWith("announce:")) continue;
      }

      if (msg.includes("embedded run start")) {
        openRuns.set(runId, time);
        lastActivityAt = time;
      } else if (msg.includes("embedded run done")) {
        openRuns.delete(runId);
        lastActivityAt = time;
      }
    }

    return {
      status: openRuns.size > 0 ? "working" : "idle",
      lastActivityAt,
    };
  } catch {
    return { status: "idle", lastActivityAt: null };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readLegacyStatus(filePath: string): Record<string, any> | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Fetch agent activity + task data in parallel with file reads
    const robertoActivityPromise = getAgentActivityData("roberto");
    const andresActivityPromise = getAgentActivityData("andres");
    const marinaActivityPromise = getAgentActivityData("marina");
    const arturoActivityPromise = getAgentActivityData("arturo");
    const alexActivityPromise = getAgentActivityData("alex");
    const taskDataPromise = getAgentTasks();

    // Try new multi-agent format first
    const multiPath = path.join(HOME, "clawd", "agents-status.json");
    if (fs.existsSync(multiPath)) {
      const data = JSON.parse(fs.readFileSync(multiPath, "utf-8"));

      // Ensure all agents exist (gateway may not include new agents yet)
      for (const agentId of ["alfred", "roberto", "andres", "marina", "arturo", "alex"]) {
        if (!data[agentId]) {
          data[agentId] = { ...DEFAULT_AGENT };
        }
      }

      // Override with realtime gateway status
      for (const agentId of ["alfred", "roberto", "andres", "marina", "arturo", "alex"]) {
        const rt = getRealtimeStatus(agentId);
        if (rt.status === "working" && data[agentId]) {
          data[agentId].status = "working";
        }
        if (rt.lastActivityAt && data[agentId]) {
          const logTime = new Date(rt.lastActivityAt).getTime();
          const fileTime = new Date(data[agentId].lastActivity || 0).getTime();
          if (logTime > fileTime) {
            data[agentId].lastActivity = rt.lastActivityAt;
          }
        }
      }

      // Enrich agents with Supabase activity + task data
      const [robertoActivity, andresActivity, marinaActivity, arturoActivity, alexActivity, taskData] = await Promise.all([robertoActivityPromise, andresActivityPromise, marinaActivityPromise, arturoActivityPromise, alexActivityPromise, taskDataPromise]);

      for (const [key, activity] of [["roberto", robertoActivity], ["andres", andresActivity], ["marina", marinaActivity], ["arturo", arturoActivity], ["alex", alexActivity]] as const) {
        if (data[key]) {
          if (!data[key].lastActivityDescription && activity.lastActivityDescription) {
            data[key].lastActivityDescription = activity.lastActivityDescription;
          }
          if ((!data[key].lastActivity || data[key].lastActivity === "") && activity.lastActivity) {
            data[key].lastActivity = activity.lastActivity;
          }
          if (data[key].interactionCount === 0 && activity.interactionCount) {
            data[key].interactionCount = activity.interactionCount;
          }
        }
      }

      // Add task data to all agents
      for (const agentId of ["alfred", "roberto", "andres", "marina", "arturo", "alex"]) {
        if (data[agentId] && taskData[agentId]) {
          data[agentId].lastTaskTitle = taskData[agentId].lastTaskTitle;
          data[agentId].lastTaskCompletedAt = taskData[agentId].lastTaskCompletedAt;
          data[agentId].nextTaskTitle = taskData[agentId].nextTaskTitle;
        }
      }

      return NextResponse.json(data);
    }

    // Fall back to legacy alfred-status.json
    const legacyPath = path.join(HOME, "clawd", "alfred-status.json");
    const legacyData = readLegacyStatus(legacyPath);
    const alfredRt = getRealtimeStatus("alfred");

    const alfred: AgentStatusData = {
      ...DEFAULT_AGENT,
      ...(legacyData
        ? {
            status: legacyData.status === "working" ? "working" : "idle",
            lastActivity: legacyData.lastActivity || "",
            lastActivityDescription: legacyData.lastActivityDescription || legacyData.currentActivity || "",
            lastCost: legacyData.lastCost || 0,
            lastModel: legacyData.lastModel || "",
            totalCostAll: legacyData.totalCost || 0,
            interactionCount: legacyData.interactionCount || 0,
          }
        : {}),
    };

    if (alfredRt.status === "working") {
      alfred.status = "working";
    }
    if (alfredRt.lastActivityAt) {
      const logTime = new Date(alfredRt.lastActivityAt).getTime();
      const fileTime = new Date(alfred.lastActivity || 0).getTime();
      if (logTime > fileTime) {
        alfred.lastActivity = alfredRt.lastActivityAt;
      }
    }

    const [robertoActivity, andresActivity, marinaActivity, taskData] = await Promise.all([robertoActivityPromise, andresActivityPromise, marinaActivityPromise, taskDataPromise]);
    return NextResponse.json({
      alfred: { ...alfred, ...taskData.alfred },
      roberto: { ...DEFAULT_AGENT, ...robertoActivity, ...taskData.roberto },
      andres: { ...DEFAULT_AGENT, ...andresActivity, ...taskData.andres },
      marina: { ...DEFAULT_AGENT, ...marinaActivity, ...taskData.marina },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load status" },
      { status: 500 }
    );
  }
}

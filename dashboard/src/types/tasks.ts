export interface TaskComment {
  author: string;
  text: string;
  timestamp: string;
}

export interface AgentTask {
  id: string;
  created_at: string;
  updated_at: string;
  assigned_to: string;
  created_by: string;
  task_type: string;
  status: "backlog" | "pendiente" | "en_progreso" | "completada" | "fallida";
  priority: "urgente" | "alta" | "media" | "baja";
  title: string;
  description: string | null;
  brief: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  comments: TaskComment[];
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  session_id: string | null;
}

export interface AgentActivity {
  id: string;
  created_at: string;
  agent_id: string;
  action: string;
  task_id: string | null;
  details: Record<string, unknown> | null;
  duration_ms: number | null;
}

export type TaskStatus = AgentTask["status"];
export type TaskPriority = AgentTask["priority"];

export const TASK_STATUSES: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "pendiente", label: "Pendiente" },
  { key: "en_progreso", label: "En Progreso" },
  { key: "completada", label: "Completada" },
  { key: "fallida", label: "Fallida" },
];

export const TASK_PRIORITIES: { key: TaskPriority; label: string }[] = [
  { key: "urgente", label: "Urgente" },
  { key: "alta", label: "Alta" },
  { key: "media", label: "Media" },
  { key: "baja", label: "Baja" },
];

export const AGENT_COLORS: Record<string, string> = {
  Roberto: "#A855F7",
  roberto: "#A855F7",
  Alfred: "#06B6D4",
  alfred: "#06B6D4",
  Santi: "#F59E0B",
  santi: "#F59E0B",
  "Andrés": "#F97316",
  andres: "#F97316",
  Marina: "#EC4899",
  marina: "#EC4899",
  Arturo: "#EAB308",
  arturo: "#EAB308",
  Alex: "#EF4444",
  alex: "#EF4444",
};

export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  andres: "Andrés",
  roberto: "Roberto",
  alfred: "Alfred",
  santi: "Santi",
  marina: "Marina",
  arturo: "Arturo",
  alex: "Alex",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgente: "#EF4444",
  alta: "#F59E0B",
  media: "#3B82F6",
  baja: "#71717A",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "#52525B",
  pendiente: "#71717A",
  en_progreso: "#3B82F6",
  completada: "#22C55E",
  fallida: "#EF4444",
};

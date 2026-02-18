export type CalendarStatus = "pending_review" | "approved" | "rejected" | "revision" | "published";
export type CalendarPlatform = "twitter" | "linkedin" | "instagram";

export interface ContentCalendarItem {
  id: string;
  content: string;
  platform: CalendarPlatform;
  suggested_time: string | null;
  status: CalendarStatus;
  feedback: string | null;
  version: number;
  formula_ref: string | null;
  post_metrics: Record<string, unknown>;
  created_by: string;
  task_id: string | null;
  doc_id: string | null;
  hook: string | null;
  hashtags: string[] | null;
  visual_brief: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_COLORS: Record<CalendarStatus, string> = {
  pending_review: "#F59E0B",
  approved: "#22C55E",
  rejected: "#EF4444",
  revision: "#3B82F6",
  published: "#8B5CF6",
};

export const STATUS_LABELS: Record<CalendarStatus, string> = {
  pending_review: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  revision: "En revision",
  published: "Publicado",
};

export const PLATFORM_COLORS: Record<CalendarPlatform, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E4405F",
};

export const PLATFORM_LABELS: Record<CalendarPlatform, string> = {
  twitter: "X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

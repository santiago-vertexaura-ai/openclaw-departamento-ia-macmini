export interface DocComment {
  author: string;
  text: string;
  timestamp: string;
}

export type ReviewStatus = "pending_review" | "approved" | "revision_requested" | "rejected";

export interface AgentDoc {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  content: string;
  author: string;
  doc_type: "research" | "journal" | "aprendizaje" | "report" | "analysis" | "estrategia" | "draft";
  tags: string[];
  task_id: string | null;
  word_count: number;
  rating: number | null;
  comments: DocComment[];
  review_status: ReviewStatus | null;
  review_feedback: string | null;
}

export type DocType = AgentDoc["doc_type"];

export const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string }> = {
  research: { label: "Investigacion", color: "#A855F7" },
  journal: { label: "Journal", color: "#3B82F6" },
  aprendizaje: { label: "Aprendizaje", color: "#F59E0B" },
  report: { label: "Reporte", color: "#22C55E" },
  analysis: { label: "Análisis", color: "#F97316" },
  estrategia: { label: "Estrategia", color: "#E11D48" },
  draft: { label: "Draft", color: "#EC4899" },
};

export const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; bg: string }> = {
  pending_review: { label: "Pendiente", color: "#FBBF24", bg: "rgba(251,191,36,0.1)" },
  approved: { label: "Aprobado", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  revision_requested: { label: "Revision", color: "#F97316", bg: "rgba(249,115,22,0.1)" },
  rejected: { label: "Rechazado", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

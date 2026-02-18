"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { AgentTask } from "@/types/tasks";
import { AGENT_COLORS, PRIORITY_COLORS, AGENT_DISPLAY_NAMES } from "@/types/tasks";

interface KanbanCardProps {
  task: AgentTask;
  onClick: () => void;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export default function KanbanCard({ task, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    scale: isDragging ? "1.02" : "1",
  };

  const agentColor = AGENT_COLORS[task.assigned_to] || "#71717A";
  const priorityColor = PRIORITY_COLORS[task.priority] || "#71717A";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[#141416] border border-[#27272A] rounded-lg p-3.5 cursor-pointer hover:border-[#3F3F46] hover:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-all duration-200 group"
    >
      {/* Top row: priority + agent */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityColor }}
          />
          <span className="text-[10px] font-medium text-zinc-500">
            {task.priority}
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: `${agentColor}15`,
            color: agentColor,
          }}
        >
          {AGENT_DISPLAY_NAMES[task.assigned_to] || task.assigned_to}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-zinc-100 leading-snug mb-2 group-hover:text-white transition-colors">
        {task.title}
      </p>

      {/* Bottom row: type + time */}
      <div className="flex items-center gap-2 text-[10px] text-zinc-500">
        <span className="px-1.5 py-0.5 bg-[#0A0A0B] rounded">
          {task.task_type}
        </span>
        <span>{relativeTime(task.created_at)}</span>
      </div>

      {/* Progress bar for in_progress */}
      {task.status === "en_progreso" && (
        <div className="mt-2.5 h-0.5 bg-[#0A0A0B] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 rounded-full" />
        </div>
      )}
    </div>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Archive,
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { AgentTask, TaskStatus } from "@/types/tasks";
import { STATUS_COLORS } from "@/types/tasks";
import KanbanCard from "./KanbanCard";

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; Icon: LucideIcon }
> = {
  backlog: { label: "Backlog", Icon: Archive },
  pendiente: { label: "Pendiente", Icon: Circle },
  en_progreso: { label: "En Progreso", Icon: Clock },
  completada: { label: "Completada", Icon: CheckCircle2 },
  fallida: { label: "Fallida", Icon: XCircle },
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: AgentTask[];
  onTaskClick: (task: AgentTask) => void;
}

export default function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = STATUS_CONFIG[status];
  const color = STATUS_COLORS[status];

  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      {/* Accent line */}
      <div
        className="h-0.5 rounded-full mb-3"
        style={{ backgroundColor: color }}
      />

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <config.Icon
          size={16}
          style={{ color }}
        />
        <span className="text-sm font-semibold text-zinc-300">
          {config.label}
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 p-1 rounded-lg min-h-[200px] transition-colors ${
          isOver ? "bg-[#1C1C1F]" : ""
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-zinc-700">Sin tareas</p>
          </div>
        )}
      </div>
    </div>
  );
}

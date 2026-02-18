"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import type { AgentTask, TaskStatus } from "@/types/tasks";
import { TASK_STATUSES } from "@/types/tasks";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import TaskFilters from "./TaskFilters";
import TaskDetailPanel from "./TaskDetailPanel";
import CreateTaskModal from "./CreateTaskModal";

export default function KanbanBoard() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error("Error fetching tasks:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Supabase Realtime
  useSupabaseRealtime<AgentTask>("agent_tasks", (payload) => {
    if (payload.eventType === "INSERT" && payload.new) {
      setTasks((prev) => [payload.new!, ...prev]);
    } else if (payload.eventType === "UPDATE" && payload.new) {
      setTasks((prev) =>
        prev.map((t) => (t.id === payload.new!.id ? payload.new! : t))
      );
      if (selectedTask && payload.new && selectedTask.id === payload.new.id) {
        setSelectedTask(payload.new);
      }
    } else if (payload.eventType === "DELETE" && payload.old) {
      setTasks((prev) => prev.filter((t) => t.id !== payload.old?.id));
    }
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (search && !task.title.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (agentFilter && task.assigned_to !== agentFilter) return false;
    return true;
  });

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks
      .filter((t) => t.status === status)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback handled by useDroppable isOver
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    // Only update if dropped on a valid column
    if (!TASK_STATUSES.some((s) => s.key === newStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    // Persist to Supabase
    const updates: Record<string, unknown> = {
      id: taskId,
      status: newStatus,
    };
    if (newStatus === "en_progreso" && !task.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (newStatus === "completada" && !task.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-zinc-500">Cargando tareas...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-zinc-100">Tareas</h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          <Plus size={14} />
          Nueva Tarea
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TaskFilters
          search={search}
          onSearchChange={setSearch}
          agentFilter={agentFilter}
          onAgentFilterChange={setAgentFilter}
        />
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {TASK_STATUSES.map((s) => (
            <KanbanColumn
              key={s.key}
              status={s.key}
              tasks={tasksByStatus(s.key)}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanCard task={activeTask} onClick={() => {}} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <TaskDetailPanel
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdated={fetchTasks}
      />
      <CreateTaskModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchTasks}
      />
    </div>
  );
}

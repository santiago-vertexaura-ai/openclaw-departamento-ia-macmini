"use client";

import { Search } from "lucide-react";

interface TaskFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  agentFilter: string;
  onAgentFilterChange: (value: string) => void;
}

const AGENTS = [
  { key: "", label: "Todos" },
  { key: "roberto", label: "Roberto" },
  { key: "alfred", label: "Alfred" },
  { key: "andres", label: "Andrés" },
  { key: "marina", label: "Marina" },
];

export default function TaskFilters({
  search,
  onSearchChange,
  agentFilter,
  onAgentFilterChange,
}: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 max-w-xs">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#3F3F46] transition-colors"
        />
      </div>
      <div className="flex gap-1">
        {AGENTS.map((agent) => (
          <button
            key={agent.key}
            onClick={() => onAgentFilterChange(agent.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              agentFilter === agent.key
                ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#1C1C1F] border border-transparent"
            }`}
          >
            {agent.label}
          </button>
        ))}
      </div>
    </div>
  );
}

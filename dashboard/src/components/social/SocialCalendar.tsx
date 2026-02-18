"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar, LayoutGrid } from "lucide-react";
import {
  ContentCalendarItem,
  CalendarPlatform,
  CalendarStatus,
  STATUS_COLORS,
  STATUS_LABELS,
  PLATFORM_COLORS,
  PLATFORM_LABELS,
} from "@/types/calendar";
import ContentDetailModal from "./ContentDetailModal";

type ViewMode = "week" | "month";

const DAYS_SHORT = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMonthWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const monday = getMonday(firstDay);
  const weeks: Date[][] = [];
  const current = new Date(monday);

  // Generate enough weeks to cover the entire month
  for (let w = 0; w < 6; w++) {
    const week = getWeekDates(new Date(current));
    weeks.push(week);
    current.setDate(current.getDate() + 7);
    // Stop if we've passed the month
    if (current.getMonth() > month && current.getFullYear() >= year) break;
    if (current.getFullYear() > year) break;
  }

  return weeks;
}

function PlatformBadge({ platform }: { platform: CalendarPlatform }) {
  const color = PLATFORM_COLORS[platform];
  const label = PLATFORM_LABELS[platform];
  return (
    <span
      className="text-[8px] font-bold px-1.5 py-0.5 rounded"
      style={{
        background: `${color}20`,
        color: color,
      }}
    >
      {label}
    </span>
  );
}

function StatusDot({ status }: { status: CalendarStatus }) {
  const color = STATUS_COLORS[status];
  const label = STATUS_LABELS[status];
  return (
    <span className="flex items-center gap-1">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: color }}
      />
      <span className="text-[8px] text-zinc-500">{label}</span>
    </span>
  );
}

function CalendarCard({
  item,
  compact,
  onClick,
}: {
  item: ContentCalendarItem;
  compact?: boolean;
  onClick: () => void;
}) {
  const statusColor = STATUS_COLORS[item.status];

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border border-[#27272A] hover:border-[#3F3F46] transition-all cursor-pointer group"
      style={{ background: "#141416" }}
    >
      {/* Status bar top */}
      <div
        className="h-[2px] rounded-t-lg"
        style={{ background: statusColor }}
      />
      <div className={compact ? "p-1.5" : "p-2"}>
        {/* Hook or content preview */}
        <p
          className={`text-zinc-300 leading-tight mb-1 group-hover:text-zinc-100 transition-colors ${
            compact ? "text-[9px] line-clamp-1" : "text-[10px] line-clamp-2"
          }`}
        >
          {item.hook || item.content.slice(0, 80)}
        </p>

        {/* Platform + status */}
        <div className="flex items-center justify-between gap-1">
          <PlatformBadge platform={item.platform} />
          {!compact && <StatusDot status={item.status} />}
        </div>

        {/* Time if available */}
        {!compact && item.suggested_time && (
          <div className="text-[8px] text-zinc-600 mt-1">
            {new Date(item.suggested_time).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </button>
  );
}

// Filter bar
function FilterBar({
  statusFilter,
  platformFilter,
  onStatusChange,
  onPlatformChange,
}: {
  statusFilter: string;
  platformFilter: string;
  onStatusChange: (v: string) => void;
  onPlatformChange: (v: string) => void;
}) {
  const statuses: { key: string; label: string }[] = [
    { key: "", label: "Todos" },
    { key: "pending_review", label: "Pendiente" },
    { key: "approved", label: "Aprobado" },
    { key: "revision", label: "Revision" },
    { key: "rejected", label: "Rechazado" },
    { key: "published", label: "Publicado" },
  ];

  const platforms: { key: string; label: string }[] = [
    { key: "", label: "Todos" },
    { key: "twitter", label: "X" },
    { key: "linkedin", label: "LI" },
    { key: "instagram", label: "IG" },
  ];

  return (
    <div className="flex gap-3 mb-3">
      <div className="flex gap-1">
        {statuses.map((s) => (
          <button
            key={s.key}
            onClick={() => onStatusChange(s.key)}
            className={`px-2 py-1 text-[9px] font-medium rounded transition-all ${
              statusFilter === s.key
                ? "bg-[#27272A] text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="w-px bg-[#27272A]" />
      <div className="flex gap-1">
        {platforms.map((p) => (
          <button
            key={p.key}
            onClick={() => onPlatformChange(p.key)}
            className={`px-2 py-1 text-[9px] font-medium rounded transition-all ${
              platformFilter === p.key
                ? "bg-[#27272A] text-zinc-200"
                : "text-zinc-600 hover:text-zinc-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SocialCalendar() {
  const [items, setItems] = useState<ContentCalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedItem, setSelectedItem] = useState<ContentCalendarItem | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (platformFilter) params.set("platform", platformFilter);

      const res = await fetch(`/api/content-calendar?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleItemUpdated = (updated: ContentCalendarItem) => {
    setItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    setSelectedItem(null);
  };

  const today = new Date();
  const todayKey = formatDateKey(today);

  // Group items by date
  const itemsByDate: Record<string, ContentCalendarItem[]> = {};
  // Items without suggested_time
  const unscheduled: ContentCalendarItem[] = [];

  for (const item of items) {
    if (item.suggested_time) {
      const key = formatDateKey(new Date(item.suggested_time));
      if (!itemsByDate[key]) itemsByDate[key] = [];
      itemsByDate[key].push(item);
    } else {
      unscheduled.push(item);
    }
  }

  // Week view data
  const currentMonday = getMonday(today);
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(currentMonday);

  const weekEnd = new Date(weekDates[6]);
  const weekLabel = `${weekDates[0].getDate()} ${weekDates[0].toLocaleDateString("es-AR", { month: "short" })} - ${weekEnd.getDate()} ${weekEnd.toLocaleDateString("es-AR", { month: "short", year: "numeric" })}`;

  // Month view data
  const monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const monthWeeks = getMonthWeeks(monthDate.getFullYear(), monthDate.getMonth());
  const monthLabel = monthDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  const statusCounts: Record<string, number> = {};
  for (const item of items) {
    statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Calendario de Contenido
          </h3>
          {/* Status summary pills */}
          <div className="flex gap-1.5">
            {Object.entries(statusCounts).map(([status, count]) => (
              <span
                key={status}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: `${STATUS_COLORS[status as CalendarStatus]}15`,
                  color: STATUS_COLORS[status as CalendarStatus],
                }}
              >
                {count} {STATUS_LABELS[status as CalendarStatus]?.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-md border border-[#27272A] overflow-hidden">
            <button
              onClick={() => setViewMode("week")}
              className={`p-1.5 transition-colors ${
                viewMode === "week"
                  ? "bg-[#27272A] text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
              title="Vista semanal"
            >
              <Calendar size={12} />
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`p-1.5 transition-colors ${
                viewMode === "month"
                  ? "bg-[#27272A] text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
              title="Vista mensual"
            >
              <LayoutGrid size={12} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                viewMode === "week"
                  ? setWeekOffset((w) => w - 1)
                  : setMonthOffset((m) => m - 1)
              }
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded border border-[#27272A] hover:border-[#3F3F46] transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                setWeekOffset(0);
                setMonthOffset(0);
              }}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded border border-[#27272A] hover:border-[#3F3F46] transition-all"
            >
              Hoy
            </button>
            <button
              onClick={() =>
                viewMode === "week"
                  ? setWeekOffset((w) => w + 1)
                  : setMonthOffset((m) => m + 1)
              }
              className="p-1 text-zinc-500 hover:text-zinc-300 rounded border border-[#27272A] hover:border-[#3F3F46] transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Current range label */}
          <span className="text-[11px] text-zinc-400 font-medium min-w-[140px] text-right">
            {viewMode === "week" ? weekLabel : monthLabel}
          </span>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        statusFilter={statusFilter}
        platformFilter={platformFilter}
        onStatusChange={setStatusFilter}
        onPlatformChange={setPlatformFilter}
      />

      {loading ? (
        <div className="text-center py-12 text-zinc-600 text-sm">
          Cargando calendario...
        </div>
      ) : viewMode === "week" ? (
        /* ===== WEEK VIEW ===== */
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateKey = formatDateKey(date);
            const isToday = dateKey === todayKey;
            const dayItems = itemsByDate[dateKey] || [];

            return (
              <div key={i} className="min-h-[140px]">
                {/* Day header */}
                <div
                  className={`text-center text-[10px] font-medium mb-2 py-1.5 rounded ${
                    isToday
                      ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                      : "text-zinc-600"
                  }`}
                >
                  <div>{DAYS_SHORT[i]}</div>
                  <div className="text-[13px] font-bold">{date.getDate()}</div>
                </div>
                {/* Items */}
                <div className="space-y-1.5">
                  {dayItems.map((item) => (
                    <CalendarCard
                      key={item.id}
                      item={item}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ===== MONTH VIEW ===== */
        <div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_SHORT.map((d) => (
              <div
                key={d}
                className="text-center text-[9px] font-semibold text-zinc-600 uppercase py-1"
              >
                {d}
              </div>
            ))}
          </div>
          {/* Weeks */}
          {monthWeeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
              {week.map((date, di) => {
                const dateKey = formatDateKey(date);
                const isToday = dateKey === todayKey;
                const isCurrentMonth =
                  date.getMonth() === monthDate.getMonth();
                const dayItems = itemsByDate[dateKey] || [];

                return (
                  <div
                    key={di}
                    className={`min-h-[80px] rounded-md border p-1 ${
                      isToday
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-[#1A1A1C]"
                    } ${!isCurrentMonth ? "opacity-40" : ""}`}
                    style={{ background: isToday ? undefined : "#0E0E10" }}
                  >
                    <div
                      className={`text-[10px] font-medium mb-1 ${
                        isToday ? "text-blue-400" : "text-zinc-600"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <CalendarCard
                          key={item.id}
                          item={item}
                          compact
                          onClick={() => setSelectedItem(item)}
                        />
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[8px] text-zinc-600 text-center">
                          +{dayItems.length - 2} mas
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Unscheduled items */}
      {unscheduled.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#27272A]">
          <h4 className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">
            Sin programar ({unscheduled.length})
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {unscheduled.map((item) => (
              <CalendarCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !loading && (
        <div className="text-center py-12 text-zinc-600 text-sm">
          <Calendar size={24} className="mx-auto mb-2 opacity-40" />
          Sin contenido en el calendario
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <ContentDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={handleItemUpdated}
        />
      )}
    </div>
  );
}

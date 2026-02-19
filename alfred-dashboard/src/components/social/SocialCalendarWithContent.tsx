"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type ViewMode = "week" | "month";

interface CalendarItem {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  review_status: "pending_review" | "approved" | "rejected";
  status: string;
  author: string;
  created_at: string;
}

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

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  instagram: "#E1306C",
  tiktok: "#000000",
  youtube: "#FF0000",
  email: "#757575",
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
  publicado: "#10B981",
  programado: "#3B82F6",
};

export default function SocialCalendarWithContent() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [viewMode, _setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }, []);

  // Cargar items del calendar
  useEffect(() => {
    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from("content_calendar")
          .select("*")
          .order("scheduled_at", { ascending: true });

        if (error) throw error;
        console.log("Loaded items:", data?.length || 0);
        setItems(data || []);
      } catch (err) {
        console.error("Error cargando calendar:", err);
      } finally {
        setLoading(false);
      }
    };

    loadItems();

    const subscription = supabase
      .channel("content_calendar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_calendar" },
        () => {
          loadItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function markAsPublished(item: CalendarItem) {
    try {
      setPublishingId(item.id);
      
      const { error } = await supabase
        .from("content_calendar")
        .update({ status: "publicado", review_status: "approved" })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "publicado", review_status: "approved" } : i
        )
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error marcando como publicado:", err);
    } finally {
      setPublishingId(null);
    }
  }

  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    items.forEach((item) => {
      const dateKey = formatDateKey(new Date(item.scheduled_at));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return grouped;
  }, [items]);

  const weeks: Date[][] =
    viewMode === "month"
      ? Array.from({ length: 6 }, (_, i) => {
          const d = new Date(getMonday(currentDate));
          d.setDate(d.getDate() + i * 7);
          return getWeekDates(d);
        })
      : [getWeekDates(getMonday(currentDate))];

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Cargando calendar...</div>;
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Calendar Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
            >
              Hoy
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-2 flex-1 overflow-y-auto">
          {DAYS_SHORT.map((day) => (
            <div key={day} className="text-center font-semibold text-sm py-2 border-b">
              {day}
            </div>
          ))}

          {weeks.map((week) =>
            week.map((date) => {
              const dateKey = formatDateKey(date);
              const dayItems = itemsByDate[dateKey] || [];
              const isToday = formatDateKey(new Date()) === dateKey;

              return (
                <div
                  key={dateKey}
                  className={`min-h-32 border rounded-lg p-2 ${
                    isToday ? "bg-blue-50 border-blue-300" : "bg-white border-gray-200"
                  } overflow-y-auto`}
                >
                  <p className={`text-sm font-semibold mb-2 ${isToday ? "text-blue-700" : "text-gray-700"}`}>
                    {date.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="w-full text-left p-1 rounded text-xs truncate hover:opacity-75 transition"
                        style={{
                          background: PLATFORM_COLORS[item.platform] + "20",
                          borderLeft: `3px solid ${PLATFORM_COLORS[item.platform]}`,
                          color: PLATFORM_COLORS[item.platform],
                        }}
                        title={item.title}
                      >
                        <span className="font-medium">{item.platform}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem ? (
        <div className="w-96 border-l border-gray-200 overflow-y-auto pl-4 space-y-4">
          <h3 className="text-lg font-bold">{selectedItem.title}</h3>

          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
            <div>
              <span className="font-medium">Platform:</span>
              <span
                className="ml-2 px-2 py-1 rounded text-xs font-medium"
                style={{ background: PLATFORM_COLORS[selectedItem.platform] + "20", color: PLATFORM_COLORS[selectedItem.platform] }}
              >
                {selectedItem.platform}
              </span>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span
                className="ml-2 px-2 py-1 rounded text-xs font-medium"
                style={{ background: STATUS_COLORS[selectedItem.status] + "40", color: STATUS_COLORS[selectedItem.status] }}
              >
                {selectedItem.status}
              </span>
            </div>
            <div>
              <span className="font-medium">Review:</span>
              <span
                className="ml-2 px-2 py-1 rounded text-xs font-medium"
                style={{ background: STATUS_COLORS[selectedItem.review_status] + "40", color: STATUS_COLORS[selectedItem.review_status] }}
              >
                {selectedItem.review_status}
              </span>
            </div>
            <div>
              <span className="font-medium">Programado:</span>
              <span className="ml-2 text-gray-600">
                {new Date(selectedItem.scheduled_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Content Preview */}
          <div>
            <h4 className="font-medium mb-2">Contenido:</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
              {selectedItem.content}
            </div>
          </div>

          {/* Actions */}
          {selectedItem.status !== "publicado" && (
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => markAsPublished(selectedItem)}
                disabled={publishingId === selectedItem.id}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
              >
                <Check size={16} />
                {publishingId === selectedItem.id ? "Publicando..." : "Marcar Publicado"}
              </button>
              <button
                onClick={() => setSelectedItem(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          )}

          {selectedItem.status === "publicado" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-green-700 font-medium">✓ Contenido publicado</p>
              <p className="text-xs text-green-600 mt-1">
                Publicado: {new Date(selectedItem.scheduled_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-96 border-l border-gray-200 flex items-center justify-center text-gray-400">
          <p>Selecciona un post para ver detalles</p>
        </div>
      )}
    </div>
  );
}

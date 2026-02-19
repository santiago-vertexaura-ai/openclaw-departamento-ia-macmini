"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

type CalendarItem = {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  review_status: "pending_review" | "pending_revision" | "approved" | "rejected";
  status: string;
  author: string;
  feedback?: string;
};

const DAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"];

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  twitter: { bg: "#1DA1F220", border: "#1DA1F2", text: "#1DA1F2" },
  linkedin: { bg: "#0A66C220", border: "#0A66C2", text: "#0A66C2" },
  instagram: { bg: "#E1306C20", border: "#E1306C", text: "#E1306C" },
  tiktok: { bg: "#25F4EE20", border: "#25F4EE", text: "#25F4EE" },
  youtube: { bg: "#FF000020", border: "#FF0000", text: "#FF0000" },
  email: { bg: "#FFD60020", border: "#FFD600", text: "#FFD600" },
};

const STATUS_COLORS: Record<string, string> = {
  pending_review: "#F59E0B",
  approved: "#10B981",
  rejected: "#EF4444",
  publicado: "#10B981",
  programado: "#3B82F6",
};

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

export default function SocialCalendarWeekly() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const { data, error } = await supabase
          .from("content_calendar")
          .select("*")
          .order("scheduled_at", { ascending: true });

        if (error) throw error;
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
      console.error("Error:", err);
    } finally {
      setPublishingId(null);
    }
  }

  async function approveContent(item: CalendarItem) {
    try {
      const { error } = await supabase
        .from("content_calendar")
        .update({ review_status: "approved", status: "aprobado" })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "aprobado", review_status: "approved" } : i
        )
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function rejectContent(item: CalendarItem) {
    try {
      const { error } = await supabase
        .from("content_calendar")
        .update({ review_status: "rejected", status: "rechazado" })
        .eq("id", item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "rechazado", review_status: "rejected" } : i
        )
      );
      setSelectedItem(null);
    } catch (err) {
      console.error("Error:", err);
    }
  }

  async function requestRevision(item: CalendarItem) {
    try {
      if (!feedbackText.trim()) {
        alert("Por favor escribe feedback antes de pedir revisión");
        return;
      }

      // Actualizar content_calendar con feedback
      const { error } = await supabase
        .from("content_calendar")
        .update({ 
          review_status: "pending_revision",
          feedback: feedbackText
        })
        .eq("id", item.id);

      if (error) throw error;

      // Crear tarea para Marina con el feedback
      const taskBrief = {
        source_calendar_id: item.id,
        feedback: feedbackText
      };

      await fetch("/api/create-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `REVISIÓN: ${item.title} (Feedback Santi)`,
          assigned_to: "marina",
          task_type: "content_creation",
          priority: "alta",
          status: "pendiente",
          brief: taskBrief,
          comments: [{
            author: "Santi",
            text: feedbackText,
            timestamp: new Date().toISOString()
          }]
        })
      });

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { 
            ...i, 
            review_status: "pending_revision",
            feedback: feedbackText
          } : i
        )
      );
      setSelectedItem(null);
      setShowFeedbackModal(false);
      setFeedbackText("");
    } catch (err) {
      console.error("Error:", err);
    }
  }

  const weekDates = getWeekDates(getMonday(currentDate));
  
  const itemsByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    items.forEach((item) => {
      const dateKey = formatDateKey(new Date(item.scheduled_at));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return grouped;
  }, [items]);

  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        Cargando...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Calendar</h1>
          <p className="text-sm text-gray-400 mt-1">
            {weekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - {weekEnd.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7))}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium text-gray-300 backdrop-blur-xl"
          >
            Hoy
          </button>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7))}
            className="p-2 rounded-lg hover:bg-white/10 transition"
          >
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 grid grid-cols-7 gap-3 min-h-0">
        {weekDates.map((date) => {
          const dateKey = formatDateKey(date);
          const dayItems = itemsByDate[dateKey] || [];
          const isToday = formatDateKey(new Date()) === dateKey;

          return (
            <div
              key={dateKey}
              className={`rounded-2xl overflow-hidden flex flex-col backdrop-blur-xl transition ${
                isToday
                  ? "bg-blue-500/20 border border-blue-400/30 ring-1 ring-blue-500/20"
                  : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
              }`}
            >
              {/* Day Header */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className={`text-sm font-semibold ${isToday ? "text-blue-300" : "text-gray-400"}`}>
                  {DAYS_SHORT[date.getDay() === 0 ? 6 : date.getDay() - 1]}
                </p>
                <p className={`text-lg font-bold ${isToday ? "text-blue-200" : "text-white"}`}>
                  {date.getDate()}
                </p>
              </div>

              {/* Posts List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {dayItems.length === 0 ? (
                  <p className="text-xs text-gray-600 text-center py-8">Sin contenido</p>
                ) : (
                  dayItems.map((item) => {
                    const colors = PLATFORM_COLORS[item.platform];
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className="w-full text-left p-2 rounded-lg transition group hover:bg-white/20"
                        style={{
                          background: colors.bg,
                          border: `1px solid ${colors.border}40`,
                        }}
                      >
                        <p
                          className="text-xs font-semibold truncate group-hover:opacity-100"
                          style={{ color: colors.text }}
                        >
                          {item.platform}
                        </p>
                        <p className="text-xs text-gray-300 truncate mt-0.5 line-clamp-1">
                          {item.title.substring(0, 30)}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1">
                          <span
                            className="inline-block w-1 h-1 rounded-full"
                            style={{ background: STATUS_COLORS[item.status] }}
                          />
                          <span className="text-[10px] text-gray-500">
                            {item.status === "publicado" ? "✓ Publicado" : "Pendiente"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Pedir Revisión</h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText("");
                }}
                className="p-1 hover:bg-gray-800 rounded-lg transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-4">Escribe feedback para Marina. Ella regenerará el contenido basándose en tus cambios.</p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Ej: Enfócate más en el hook emocional, menos en números. La audiencia es founders, no CTOs..."
              className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 min-h-32"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackText("");
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => requestRevision(selectedItem)}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition"
              >
                Enviar Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedItem && (
        <div className="absolute bottom-0 right-0 top-0 w-96 bg-black/40 backdrop-blur-xl border-l border-white/10 overflow-y-auto rounded-l-2xl shadow-2xl">
          <div className="h-full flex flex-col p-6 space-y-4">
            {/* Close button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X size={20} className="text-gray-400" />
            </button>

            {/* Title */}
            <div>
              <h2 className="text-xl font-bold text-white pr-8">{selectedItem.title}</h2>
            </div>

            {/* Metadata */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-gray-400">Platform</span>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: PLATFORM_COLORS[selectedItem.platform].bg,
                    color: PLATFORM_COLORS[selectedItem.platform].text,
                    border: `1px solid ${PLATFORM_COLORS[selectedItem.platform].border}40`,
                  }}
                >
                  {selectedItem.platform.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-gray-400">Status</span>
                <span
                  className="text-xs font-bold px-2 py-1 rounded-lg"
                  style={{
                    background: STATUS_COLORS[selectedItem.status] + "30",
                    color: STATUS_COLORS[selectedItem.status],
                  }}
                >
                  {selectedItem.status === "publicado" ? "✓ Publicado" : "Pendiente"}
                </span>
              </div>

              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-sm text-gray-400">Programado</span>
                <span className="text-xs text-gray-300">
                  {new Date(selectedItem.scheduled_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Content */}
            <div>
              <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Contenido</p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{selectedItem.content}</p>
              </div>
            </div>

            {/* Comentarios de Revisión */}
            {selectedItem.feedback && (
              <div>
                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Feedback para Marina</p>
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-300 mb-1">Santi:</p>
                  <p className="text-xs text-gray-200">{selectedItem.feedback}</p>
                </div>
              </div>
            )}

            {/* Actions - Review Panel */}
            {selectedItem.status === "publicado" ? (
              <div className="w-full py-3 rounded-lg bg-green-600/20 border border-green-500/30 text-center mt-auto">
                <p className="text-sm font-medium text-green-300">✓ Publicado</p>
              </div>
            ) : (
              <div className="space-y-2 mt-auto">
                {/* Aprobar */}
                <button
                  onClick={() => approveContent(selectedItem)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition font-medium text-white"
                >
                  <Check size={18} />
                  Aprobar
                </button>

                {/* Pedir Revisión */}
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition font-medium text-white"
                >
                  ✎ Pedir Revisión
                </button>

                {/* Rechazar */}
                <button
                  onClick={() => rejectContent(selectedItem)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition font-medium text-white"
                >
                  <X size={18} />
                  Rechazar
                </button>

                {/* Marcar Publicado (después de aprobar) */}
                {selectedItem.status === "aprobado" && (
                  <button
                    onClick={() => markAsPublished(selectedItem)}
                    disabled={publishingId === selectedItem.id}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition font-medium text-white"
                  >
                    <Check size={18} />
                    {publishingId === selectedItem.id ? "Publicando..." : "Marcar Publicado"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

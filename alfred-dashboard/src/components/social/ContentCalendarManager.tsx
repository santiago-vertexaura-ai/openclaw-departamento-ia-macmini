"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronRight, Check, X, MessageSquare, Clock } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

interface CalendarItem {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  review_status: "pending_review" | "approved" | "rejected";
  status: string;
  author: string;
  task_id: string | null;
  feedback?: string;
}

export default function ContentCalendarManager() {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [action, setAction] = useState<string | null>(null);

  // Crear cliente una sola vez
  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }, []);

  // Cargar items del calendar
  useEffect(() => {
    if (!supabase) return;

    const loadItems = async () => {
      try {
        console.log("Fetching from content_calendar...");
        const { data, error } = await supabase
          .from("content_calendar")
          .select("*")
          .order("scheduled_at", { ascending: true });

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        console.log("✅ Loaded items:", data?.length || 0, data);
        setItems(data || []);
      } catch (err) {
        console.error("Error cargando calendar:", err);
      } finally {
        setLoading(false);
      }
    };

    loadItems();

    // Subscribe a cambios en tiempo real
    const subscription = supabase
      .channel("content_calendar")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_calendar" },
        () => {
          console.log("Real-time update detected");
          loadItems();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function approveContent(item: CalendarItem) {
    try {
      const { error } = await supabase
        .from("content_calendar")
        .update({ review_status: "approved" })
        .eq("id", item.id);

      if (error) throw error;
      
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, review_status: "approved" } : i
        )
      );
      setSelectedItem(null);
      setAction(null);
    } catch (err) {
      console.error("Error aprobando:", err);
    }
  }

  async function rejectContent(item: CalendarItem, feedbackText: string) {
    try {
      // Actualizar calendar
      const { error: updateError } = await supabase
        .from("content_calendar")
        .update({ review_status: "rejected", feedback: feedbackText })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // Crear tarea para Marina
      const { error: taskError } = await supabase
        .from("agent_tasks")
        .insert({
          title: `Revision: ${item.title}`,
          assigned_to: "marina",
          created_by: "santi",
          task_type: "content_creation",
          priority: "alta",
          status: "pendiente",
          brief: {
            original_id: item.id,
            feedback: feedbackText,
            content_type: item.platform,
            instructions: "Revisa el feedback y genera variante mejorada. Completa con JSON en result field."
          }
        });

      if (taskError) throw taskError;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, review_status: "rejected", feedback: feedbackText } : i
        )
      );
      setSelectedItem(null);
      setFeedback("");
      setAction(null);
    } catch (err) {
      console.error("Error rechazando:", err);
    }
  }

  async function requestRevision(item: CalendarItem, feedbackText: string) {
    try {
      // Actualizar calendar
      const { error: updateError } = await supabase
        .from("content_calendar")
        .update({ review_status: "pending_review", feedback: feedbackText })
        .eq("id", item.id);

      if (updateError) throw updateError;

      // Crear tarea para Marina
      const { error: taskError } = await supabase
        .from("agent_tasks")
        .insert({
          title: `Revision: ${item.title}`,
          assigned_to: "marina",
          created_by: "santi",
          task_type: "content_creation",
          priority: "alta",
          status: "pendiente",
          brief: {
            original_id: item.id,
            feedback: feedbackText,
            instructions: "Genera variante mejorada basada en el feedback. Completa tarea con JSON."
          }
        });

      if (taskError) throw taskError;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, feedback: feedbackText } : i
        )
      );
      setSelectedItem(null);
      setFeedback("");
      setAction(null);
    } catch (err) {
      console.error("Error pidiendo revisión:", err);
    }
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: "bg-blue-100 text-blue-700",
      linkedin: "bg-cyan-100 text-cyan-700",
      instagram: "bg-pink-100 text-pink-700",
      tiktok: "bg-black text-white",
      youtube: "bg-red-100 text-red-700",
      email: "bg-gray-100 text-gray-700",
    };
    return colors[platform] || "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_review: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      programado: "bg-blue-100 text-blue-700",
      publicado: "bg-green-100 text-green-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Cargando calendar...</div>;
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {/* Lista Calendar (50%) */}
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto pr-4">
        <h2 className="text-lg font-bold mb-4 sticky top-0 bg-white py-2">Social Calendar ({items.length})</h2>
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Sin contenido programado</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setAction(null);
                  setFeedback("");
                }}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  selectedItem?.id === item.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded ${getPlatformColor(item.platform)}`}>
                        {item.platform}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.review_status)}`}>
                        {item.review_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {new Date(item.scheduled_at).toLocaleDateString()} {new Date(item.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Panel Detalles (50%) */}
      {selectedItem ? (
        <div className="w-1/2 border-l border-gray-200 overflow-y-auto flex flex-col pl-4">
          {/* Preview */}
          <div className="flex-1 space-y-4">
            <h3 className="font-bold text-lg">{selectedItem.title}</h3>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div>
                <span className="font-medium">Platform:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getPlatformColor(selectedItem.platform)}`}>
                  {selectedItem.platform}
                </span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(selectedItem.review_status)}`}>
                  {selectedItem.review_status}
                </span>
              </div>
              <div>
                <span className="font-medium">Programado:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(selectedItem.scheduled_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="font-medium">Autor:</span>
                <span className="ml-2 text-gray-600">{selectedItem.author}</span>
              </div>
            </div>

            {/* Contenido */}
            <div>
              <h4 className="font-medium mb-2">Contenido:</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedItem.content}
              </div>
            </div>

            {/* Feedback anterior */}
            {selectedItem.feedback && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-700 mb-1">Feedback previo:</p>
                <p className="text-sm text-yellow-800">{selectedItem.feedback}</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          {selectedItem.review_status !== "approved" && (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
              {action === null && (
                <div className="flex gap-2">
                  <button
                    onClick={() => approveContent(selectedItem)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 text-sm font-medium"
                  >
                    <Check size={16} />
                    Aprobar
                  </button>
                  <button
                    onClick={() => setAction("revision")}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white py-2 rounded-lg hover:bg-amber-600 text-sm font-medium"
                  >
                    <MessageSquare size={16} />
                    Revisar
                  </button>
                  <button
                    onClick={() => setAction("reject")}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 text-sm font-medium"
                  >
                    <X size={16} />
                    Rechazar
                  </button>
                </div>
              )}

              {/* Formulario Feedback */}
              {(action === "revision" || action === "reject") && (
                <div className="space-y-2">
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe tu feedback para Marina..."
                    className="w-full p-2 border border-gray-200 rounded text-sm resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (action === "revision") {
                          requestRevision(selectedItem, feedback);
                        } else {
                          rejectContent(selectedItem, feedback);
                        }
                      }}
                      className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      {action === "revision" ? "Enviar Feedback" : "Rechazar"}
                    </button>
                    <button
                      onClick={() => {
                        setAction(null);
                        setFeedback("");
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 text-sm font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedItem.review_status === "approved" && (
            <div className="border-t border-gray-200 mt-4 pt-4 bg-green-50 rounded p-3">
              <p className="text-sm text-green-700 font-medium">✓ Contenido aprobado</p>
              <p className="text-xs text-green-600 mt-1">Se publicará automáticamente a la hora programada</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-1/2 border-l border-gray-200 flex items-center justify-center text-gray-400">
          <p>Selecciona un post para revisar</p>
        </div>
      )}
    </div>
  );
}

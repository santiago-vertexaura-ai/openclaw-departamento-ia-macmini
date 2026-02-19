"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  draftsThisWeek: number;
  draftsThisMonth: number;
  approvalRate: number;
  avgRating: number | null;
  platformCounts: Record<string, number>;
  pendingReviews: number;
}

export default function SocialAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/social/analytics");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  if (!data) {
    return <div className="text-center py-12 text-zinc-600 text-sm">Cargando analytics...</div>;
  }

  const metrics = [
    { label: "Drafts esta semana", value: data.draftsThisWeek, max: 10, color: "#3B82F6" },
    { label: "Drafts este mes", value: data.draftsThisMonth, max: 30, color: "#8B5CF6" },
    { label: "Tasa aprobacion", value: Math.round(data.approvalRate), max: 100, color: "#22C55E", suffix: "%" },
    { label: "Reviews pendientes", value: data.pendingReviews, max: 10, color: "#FBBF24" },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
        Metricas de Contenido
      </h3>

      <div className="space-y-4">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-zinc-400">{m.label}</span>
              <span className="text-[13px] font-bold text-zinc-200">
                {m.value}{m.suffix || ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((m.value / m.max) * 100, 100)}%`,
                  background: m.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      {data.platformCounts && Object.keys(data.platformCounts).length > 0 && (
        <div className="rounded-xl border border-[#27272A] p-4" style={{ background: "#141416" }}>
          <h4 className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Plataformas</h4>
          <div className="space-y-2">
            {Object.entries(data.platformCounts).map(([platform, count]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-[12px] text-zinc-300 capitalize">{platform}</span>
                <span className="text-[12px] font-mono text-zinc-400">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.avgRating && (
        <div className="rounded-xl border border-[#27272A] p-4" style={{ background: "#141416" }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider">Rating medio</span>
            <span className="text-lg font-bold text-zinc-200">{data.avgRating.toFixed(1)} &#9733;</span>
          </div>
        </div>
      )}
    </div>
  );
}

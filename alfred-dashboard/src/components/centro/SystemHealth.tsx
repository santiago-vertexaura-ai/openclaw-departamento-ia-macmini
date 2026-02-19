"use client";

import { useEffect, useState, useRef } from "react";
import { Server } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface ServiceStatus {
  name: string;
  status: "ok" | "error";
  latencyMs?: number;
}

export default function SystemHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const { addToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/health?t=${Date.now()}`);
        if (res.ok) {
          const data: ServiceStatus[] = await res.json();
          setServices(data);

          // Detect status changes and fire toasts
          for (const svc of data) {
            const prev = prevStatusRef.current.get(svc.name);
            if (prev && prev !== svc.status) {
              if (svc.status === "error") {
                addToast({
                  type: "error",
                  title: `${svc.name} caído`,
                  message: `El servicio ${svc.name} no responde.`,
                  duration: 8000,
                });
              } else if (prev === "error" && svc.status === "ok") {
                addToast({
                  type: "success",
                  title: `${svc.name} recuperado`,
                  message: `El servicio ${svc.name} vuelve a estar operativo.`,
                });
              }
            }
            prevStatusRef.current.set(svc.name, svc.status);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [addToast]);

  const allOk = services.length > 0 && services.every(s => s.status === "ok");
  const errorCount = services.filter(s => s.status === "error").length;

  return (
    <div className="rounded-xl border border-[#27272A] p-4" style={{ background: "#141416" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400">Sistema</h3>
        </div>
        {!loading && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            allOk
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}>
            {allOk ? "Todo OK" : `${errorCount} error${errorCount > 1 ? "es" : ""}`}
          </span>
        )}
      </div>
      {loading ? (
        <p className="text-[11px] text-zinc-600">Verificando...</p>
      ) : (
        <div className="space-y-2">
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    svc.status === "ok" ? "bg-emerald-400" : "bg-red-500 animate-pulse"
                  }`}
                />
                <span className="text-[11px] text-zinc-400">{svc.name}</span>
              </div>
              {svc.latencyMs !== undefined && (
                <span className={`text-[10px] font-mono ${
                  svc.latencyMs > 1000 ? "text-amber-400" : "text-zinc-600"
                }`}>
                  {svc.latencyMs}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { AllAgentsStatus } from "@/hooks/useAgentStatus";
import { PAL3D } from "./office-constants-3d";

const ENTRIES = [
  { id: "alfred", pal: PAL3D.alfred },
  { id: "roberto", pal: PAL3D.roberto },
  { id: "andres", pal: PAL3D.andres },
  { id: "marina", pal: PAL3D.marina },
  { id: "arturo", pal: PAL3D.arturo },
  { id: "alex", pal: PAL3D.alex },
  { id: "santi", pal: PAL3D.santi },
];

export default function StatusBarOverlay({ agents }: { agents: AllAgentsStatus }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex items-center"
      style={{
        height: 44,
        background: "#080C12",
        borderTop: "1px solid rgba(255,255,255,0.03)",
        zIndex: 10,
      }}
    >
      {ENTRIES.map((e, i) => {
        const isSanti = e.id === "santi";
        const status = isSanti ? "idle" : (agents[e.id as keyof AllAgentsStatus]?.status || "idle");
        const desc = isSanti
          ? "Supervisando"
          : (agents[e.id as keyof AllAgentsStatus]?.lastActivityDescription || "");
        const dotColor = status === "working" ? "#22C55E" : status === "error" ? "#EF4444" : "#3B3B4B";
        const statusLabel = status === "working" ? "trabajando..." : status === "error" ? "error" : "descansando";

        return (
          <div
            key={e.id}
            className="flex-1 flex items-center gap-2 px-3"
            style={{
              borderLeft: i > 0 ? "1px solid #1A2030" : "none",
              minWidth: 0,
            }}
          >
            {/* Status dot */}
            <span
              className="shrink-0"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: dotColor,
                boxShadow: status === "working" ? `0 0 6px ${dotColor}60` : "none",
              }}
            />
            <div className="min-w-0">
              <div
                className="font-mono font-bold text-xs truncate"
                style={{ color: e.pal.body }}
                title={desc}
              >
                {e.pal.name}
              </div>
              <div
                className="font-mono truncate"
                style={{
                  fontSize: 9,
                  color: status === "working" ? "#4ADE80" : status === "error" ? "#F87171" : "#52525B",
                }}
              >
                {statusLabel}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useMemo } from "react";

interface ConfettiEvent {
  agentName: string;
  agentColor: string;
  count: number;
  timestamp: number;
}

interface Confetti3DProps {
  events: ConfettiEvent[];
}

export default function Confetti3D({ events }: Confetti3DProps) {
  const activeEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => now - e.timestamp < 4000);
  }, [events]);

  if (activeEvents.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: 12,
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {activeEvents.map((event, i) => {
        const age = Date.now() - event.timestamp;
        const progress = Math.min(age / 4000, 1);
        const opacity = 1 - progress;
        const translateX = -20 + 20 * Math.min(progress * 4, 1);

        return (
          <div
            key={`${event.agentName}-${event.timestamp}-${i}`}
            style={{
              background: "rgba(14,14,16,0.95)",
              border: `1px solid ${event.agentColor}44`,
              borderRadius: 8,
              padding: "8px 14px",
              boxShadow: `0 0 12px ${event.agentColor}33`,
              opacity,
              transform: `translateX(${translateX}px)`,
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 10,
                fontWeight: "bold",
                color: event.agentColor,
                lineHeight: 1.4,
              }}
            >
              {"🎉"} LOGRO!
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 9,
                color: "#9CA3AF",
                lineHeight: 1.4,
              }}
            >
              {event.agentName} completó {event.count} tareas
            </div>
          </div>
        );
      })}
    </div>
  );
}

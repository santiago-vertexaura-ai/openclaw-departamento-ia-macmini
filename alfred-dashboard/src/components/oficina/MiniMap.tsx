"use client";

import React from "react";

interface AgentInfo {
  x: number;
  z: number;
  color: string;
  name: string;
}

interface MiniMapProps {
  agents: Record<string, AgentInfo>;
}

const MAP_W = 160;
const MAP_H = 100;

// World bounds (3D coords)
const WORLD_X_MIN = -54;
const WORLD_X_MAX = 54;
const WORLD_Z_MIN = -33;
const WORLD_Z_MAX = 33;
const WORLD_W = WORLD_X_MAX - WORLD_X_MIN; // 108
const WORLD_D = WORLD_Z_MAX - WORLD_Z_MIN; // 66

function mapX(x: number): number {
  return ((x - WORLD_X_MIN) / WORLD_W) * MAP_W;
}

function mapZ(z: number): number {
  return ((z - WORLD_Z_MIN) / WORLD_D) * MAP_H;
}

// Room definitions in 3D world coords: x, z = top-left corner; w, d = width/depth
const rooms = [
  { label: "Conference", x: -53.5, z: -32.3, w: 29, d: 21 },
  { label: "Boss", x: -53.5, z: -10.3, w: 29, d: 17.5 },
  { label: "Kitchen", x: -53.5, z: 8.2, w: 29, d: 25.6 },
  { label: "Cubicles", x: -23.5, z: -32.3, w: 78.5, d: 31 },
  { label: "Lounge", x: -23.5, z: -0.3, w: 78.5, d: 34.1 },
];

export default function MiniMap({ agents }: MiniMapProps) {
  return (
    <div
      style={{
        position: "absolute",
        right: 12,
        bottom: 56,
        zIndex: 20,
        width: MAP_W,
        height: MAP_H,
        background: "rgba(10,10,11,0.85)",
        border: "1px solid #27272A",
        borderRadius: 8,
        overflow: "hidden",
        pointerEvents: "auto",
      }}
    >
      {/* Label */}
      <div
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: "100%",
          textAlign: "center",
          fontFamily: "monospace",
          fontSize: 7,
          color: "#3D4A5C",
          letterSpacing: 1.5,
          userSelect: "none",
          zIndex: 2,
        }}
      >
        MINIMAP
      </div>

      {/* Room outlines */}
      {rooms.map((room) => {
        const px = mapX(room.x);
        const pz = mapZ(room.z);
        const pw = (room.w / WORLD_W) * MAP_W;
        const pd = (room.d / WORLD_D) * MAP_H;
        return (
          <div
            key={room.label}
            style={{
              position: "absolute",
              left: px,
              top: pz,
              width: pw,
              height: pd,
              border: "1px solid rgba(255,255,255,0.08)",
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Agent dots */}
      {Object.entries(agents).map(([id, agent]) => {
        const px = mapX(agent.x);
        const pz = mapZ(agent.z);
        return (
          <div
            key={id}
            title={agent.name}
            style={{
              position: "absolute",
              left: px,
              top: pz,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: agent.color,
              boxShadow: `0 0 6px ${agent.color}`,
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              zIndex: 3,
            }}
          />
        );
      })}
    </div>
  );
}

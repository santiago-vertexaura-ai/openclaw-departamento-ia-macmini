"use client";

import React from "react";

// Room centers computed from ROOMS_3D:
// conference: center [-39, -21.8], boss: [-39, -1.55], kitchen: [-39, 21]
// cubicles: [15.75, -16.8], lounge: [15.75, 16.75]
export const CAMERA_PRESETS: Record<
  string,
  { position: [number, number, number]; target: [number, number, number]; zoom: number }
> = {
  General:    { position: [50, 40, 50],  target: [0, 0, 0],          zoom: 11 },
  Reuniones:  { position: [-10, 30, -10], target: [-39, 0, -21.8],   zoom: 18 },
  Despacho:   { position: [-10, 30, 10], target: [-39, 0, -1.5],    zoom: 20 },
  Cocina:     { position: [-10, 30, 40], target: [-39, 0, 21],      zoom: 18 },
  Trabajo:    { position: [45, 30, -5],  target: [15.75, 0, -16.8], zoom: 16 },
  Lounge:     { position: [45, 30, 30],  target: [15.75, 0, 16.75], zoom: 16 },
};

interface CameraPresetsProps {
  onSelect: (preset: string) => void;
  activePreset: string;
}

export function CameraPresets({ onSelect, activePreset }: CameraPresetsProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 6,
          borderRadius: 8,
          padding: 6,
          background: "rgba(10,10,11,0.85)",
        }}
      >
        {Object.keys(CAMERA_PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            style={{
              fontFamily: "monospace",
              fontSize: 10,
              padding: "4px 10px",
              background: "#141416",
              border: `1px solid ${activePreset === name ? "#3B82F6" : "#27272A"}`,
              color: "#ffffff",
              borderRadius: 4,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

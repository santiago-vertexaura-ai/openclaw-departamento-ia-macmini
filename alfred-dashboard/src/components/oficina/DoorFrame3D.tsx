"use client";

import React from "react";

interface DoorFrame3DProps {
  position: [number, number, number];
  rotation?: number;
  width?: number;
  height?: number;
}

export default function DoorFrame3D({
  position,
  rotation = 0,
  width = 2.5,
  height = 3.2,
}: DoorFrame3DProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Left pillar */}
      <mesh position={[-width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.15, height, 0.35]} />
        <meshStandardMaterial color="#90A8C8" />
      </mesh>

      {/* Right pillar */}
      <mesh position={[width / 2, height / 2, 0]} castShadow>
        <boxGeometry args={[0.15, height, 0.35]} />
        <meshStandardMaterial color="#90A8C8" />
      </mesh>

      {/* Top lintel */}
      <mesh position={[0, height, 0]} castShadow>
        <boxGeometry args={[width + 0.15, 0.15, 0.35]} />
        <meshStandardMaterial color="#90A8C8" />
      </mesh>
    </group>
  );
}

export const DOOR_POSITIONS: {
  position: [number, number, number];
  rotation: number;
}[] = [
  // Door between Conference and Boss office (left section, gap at y=230)
  { position: [-43, 0, -10.8] as [number, number, number], rotation: 0 },
  // Door between Boss office and Kitchen (left section, gap at y=418)
  { position: [-43, 0, 8] as [number, number, number], rotation: 0 },
  // Door between Cubicles and Lounge (right section, gap at y=332)
  { position: [-3, 0, -0.6] as [number, number, number], rotation: 0 },
];

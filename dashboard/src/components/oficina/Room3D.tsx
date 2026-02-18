"use client";

import { Html } from "@react-three/drei";
import { WALL_HEIGHT } from "./office-constants-3d";

interface Room3DProps {
  x: number;
  z: number;
  w: number;
  d: number;
  label: string;
  wallHeight?: number;
}

export default function Room3D({
  x,
  z,
  w,
  d,
  label,
  wallHeight = WALL_HEIGHT,
}: Room3DProps) {
  const cx = x + w / 2;
  const cz = z + d / 2;

  return (
    <group>
      {/* Floor plane */}
      <mesh
        position={[cx, 0.01, cz]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#0F1520" />
      </mesh>

      {/* Ceiling light */}
      <pointLight
        position={[cx, 3, cz]}
        intensity={0.15}
        color="#8899BB"
        distance={Math.max(w, d) * 1.5}
      />

      {/* Floating label — using Html instead of Text to avoid woff2 font issues */}
      <Html
        position={[cx, wallHeight + 0.5, cz]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            color: "#3D4A5C",
            fontFamily: "monospace",
            fontSize: "11px",
            fontWeight: "bold",
            letterSpacing: "2px",
            whiteSpace: "nowrap",
            userSelect: "none",
            textShadow: "0 0 8px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

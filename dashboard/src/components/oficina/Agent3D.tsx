"use client";

import { Html } from "@react-three/drei";

interface Agent3DProps {
  position: [number, number, number]; // [x, 0, z]
  color: string;       // body/shirt color
  colorDark: string;   // darker shade
  hairColor: string;
  name: string;
  isTyping: boolean;   // at desk, working
  isError: boolean;    // error state
  walkPhase: number;   // 0 or 1
  breathOffset: number;
  isFemale?: boolean;
  frame: number;       // global frame counter
}

export default function Agent3D({
  position,
  color,
  colorDark,
  hairColor,
  name,
  isTyping,
  isError,
  walkPhase,
  breathOffset,
  isFemale = false,
  frame,
}: Agent3DProps) {
  // ── Breath animation ──
  const breathY = Math.sin((frame + breathOffset) * 0.08) * 0.02;

  // ── Walking leg offsets ──
  const leftLegZ = walkPhase === 1 ? -0.08 : 0;
  const rightLegZ = walkPhase === 1 ? 0.08 : 0;

  // ── Typing arm animation ──
  const typingArmOffset = isTyping && frame % 20 < 10 ? -0.04 : 0;

  // ── Error blink ──
  const showError = isError && frame % 30 < 15;

  // ── Thought bubble dot opacities ──
  const dotOpacity = (i: number) => {
    const phase = (frame + i * 6) % 24;
    return phase < 12 ? 0.3 + (phase / 12) * 0.7 : 1.0 - ((phase - 12) / 12) * 0.7;
  };

  return (
    <group position={position}>
      {/* Shadow on ground */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Body group — breath offset applied here */}
      <group position={[0, breathY, 0]}>
        {/* ── Head ── */}
        <mesh position={[0, 1.65, 0]}>
          <sphereGeometry args={[0.22, 16, 12]} />
          <meshStandardMaterial color="#D4A574" />
        </mesh>

        {/* ── Hair (half sphere on top) ── */}
        <mesh position={[0, 1.78, 0]}>
          <sphereGeometry args={[0.23, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={hairColor} />
        </mesh>

        {/* ── Female side hair ── */}
        {isFemale && (
          <>
            {/* Left side hair */}
            <mesh position={[-0.2, 1.55, 0]}>
              <boxGeometry args={[0.06, 0.4, 0.12]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
            {/* Right side hair */}
            <mesh position={[0.2, 1.55, 0]}>
              <boxGeometry args={[0.06, 0.4, 0.12]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
          </>
        )}

        {/* ── Eyes ── */}
        <mesh position={[-0.07, 1.67, 0.18]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshStandardMaterial color="#1A1A2E" />
        </mesh>
        <mesh position={[0.07, 1.67, 0.18]}>
          <sphereGeometry args={[0.03, 8, 6]} />
          <meshStandardMaterial color="#1A1A2E" />
        </mesh>

        {/* ── Torso ── */}
        <mesh position={[0, 1.2, 0]}>
          <boxGeometry args={[0.4, 0.55, 0.25]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* ── Belt ── */}
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[0.42, 0.06, 0.26]} />
          <meshStandardMaterial color={colorDark} />
        </mesh>

        {/* ── Left Arm ── */}
        <mesh position={[-0.26, 1.15 + typingArmOffset, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* ── Right Arm ── */}
        <mesh position={[0.26, 1.15 + (isTyping ? -typingArmOffset : 0), 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.5, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* ── Left Leg ── */}
        <mesh position={[-0.1, 0.5, leftLegZ]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#1A1A2E" />
        </mesh>

        {/* ── Right Leg ── */}
        <mesh position={[0.1, 0.5, rightLegZ]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color="#1A1A2E" />
        </mesh>

        {/* ── Left Shoe ── */}
        <mesh position={[-0.1, 0.05, leftLegZ + 0.03]}>
          <boxGeometry args={[0.1, 0.1, 0.16]} />
          <meshStandardMaterial color="#252530" />
        </mesh>

        {/* ── Right Shoe ── */}
        <mesh position={[0.1, 0.05, rightLegZ + 0.03]}>
          <boxGeometry args={[0.1, 0.1, 0.16]} />
          <meshStandardMaterial color="#252530" />
        </mesh>

        {/* ── Working glow ── */}
        {isTyping && (
          <pointLight
            position={[0, 1.2, 0]}
            color={color}
            intensity={0.3}
            distance={3}
          />
        )}
      </group>

      {/* ── Name label ── */}
      <Html
        position={[0, 2.2, 0]}
        center
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            color: color,
            fontFamily: "monospace",
            fontWeight: "bold",
            fontSize: "10px",
            textShadow: "0 0 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {name}
        </div>
      </Html>

      {/* ── Thought bubble (typing) ── */}
      {isTyping && !isError && (
        <Html
          position={[0, 2.5, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(20, 20, 22, 0.9)",
              borderRadius: "12px",
              padding: "3px 8px",
              display: "flex",
              gap: "3px",
              alignItems: "center",
              border: `1px solid ${color}33`,
              userSelect: "none",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: color,
                  opacity: dotOpacity(i),
                }}
              />
            ))}
          </div>
        </Html>
      )}

      {/* ── Error indicator ── */}
      {showError && (
        <Html
          position={[0, 2.5, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              color: "#EF4444",
              fontFamily: "monospace",
              fontWeight: "bold",
              fontSize: "18px",
              textShadow: "0 0 6px rgba(239,68,68,0.6), 0 0 12px rgba(239,68,68,0.3)",
              userSelect: "none",
            }}
          >
            !
          </div>
        </Html>
      )}
    </group>
  );
}

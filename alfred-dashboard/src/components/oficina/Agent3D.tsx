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
  isSeated?: boolean;  // seated at desk
  onClick?: () => void;
  showTooltip?: boolean;
  statusText?: string;
  taskText?: string;
  activityIcon?: "check" | "new" | null; // activity indicator
  interactionType?: "chat" | "coffee" | "supervise" | null;
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
  isSeated = false,
  onClick,
  showTooltip = false,
  statusText = "",
  taskText = "",
  activityIcon = null,
  interactionType = null,
}: Agent3DProps) {
  // ── Breath animation ──
  const breathY = Math.sin((frame + breathOffset) * 0.08) * 0.02;

  // ── Walking leg offsets (disabled when seated) ──
  const leftLegZ = !isSeated && walkPhase === 1 ? -0.08 : 0;
  const rightLegZ = !isSeated && walkPhase === 1 ? 0.08 : 0;

  // ── Seated pose: legs bent forward, body lower ──
  const seatYOffset = isSeated ? -0.25 : 0;
  const legRotation = isSeated ? -Math.PI / 4 : 0; // bend legs forward

  // ── Typing arm animation ──
  const typingArmOffset = isTyping && frame % 20 < 10 ? -0.04 : 0;

  // ── Error blink ──
  const showError = isError && frame % 30 < 15;

  // ── Thought bubble dot opacities ──
  const dotOpacity = (i: number) => {
    const phase = (frame + i * 6) % 24;
    return phase < 12 ? 0.3 + (phase / 12) * 0.7 : 1.0 - ((phase - 12) / 12) * 0.7;
  };

  // ── Activity indicator fade (shown for ~3 seconds = ~180 frames) ──
  const activityOpacity = activityIcon ? Math.max(0, 1 - (frame % 180) / 180) : 0;

  return (
    <group position={position}>
      {/* Clickable invisible sphere for raycasting */}
      <mesh
        position={[0, 1.0 + seatYOffset, 0]}
        onClick={(e) => { e.stopPropagation(); onClick?.(); }}
        visible={false}
      >
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

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

      {/* Body group — breath offset + seat offset */}
      <group position={[0, breathY + seatYOffset, 0]}>
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
            <mesh position={[-0.2, 1.55, 0]}>
              <boxGeometry args={[0.06, 0.4, 0.12]} />
              <meshStandardMaterial color={hairColor} />
            </mesh>
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
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} />
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

        {/* ── Legs (rotated when seated) ── */}
        <group position={[-0.1, 0.5, 0]} rotation={[legRotation, 0, 0]}>
          <mesh position={[0, 0, leftLegZ]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#1A1A2E" />
          </mesh>
          <mesh position={[0, -0.2, leftLegZ + 0.03]}>
            <boxGeometry args={[0.1, 0.1, 0.16]} />
            <meshStandardMaterial color="#252530" />
          </mesh>
        </group>
        <group position={[0.1, 0.5, 0]} rotation={[legRotation, 0, 0]}>
          <mesh position={[0, 0, rightLegZ]}>
            <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
            <meshStandardMaterial color="#1A1A2E" />
          </mesh>
          <mesh position={[0, -0.2, rightLegZ + 0.03]}>
            <boxGeometry args={[0.1, 0.1, 0.16]} />
            <meshStandardMaterial color="#252530" />
          </mesh>
        </group>

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
        position={[0, 2.2 + seatYOffset, 0]}
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

      {/* ── Activity indicator (check / new task) ── */}
      {activityIcon && activityOpacity > 0.05 && (
        <Html
          position={[0.3, 2.4 + seatYOffset, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              fontSize: "14px",
              opacity: activityOpacity,
              userSelect: "none",
              filter: `drop-shadow(0 0 4px ${activityIcon === "check" ? "#22C55E" : "#3B82F6"})`,
            }}
          >
            {activityIcon === "check" ? "\u2713" : "\u2709"}
          </div>
        </Html>
      )}

      {/* ── Click tooltip panel ── */}
      {showTooltip && (
        <Html
          position={[0, 2.8 + seatYOffset, 0]}
          center
          style={{ pointerEvents: "auto" }}
        >
          <div
            style={{
              background: "rgba(14, 14, 16, 0.95)",
              borderRadius: "8px",
              padding: "8px 12px",
              border: `1px solid ${color}44`,
              minWidth: "140px",
              maxWidth: "200px",
              userSelect: "none",
              boxShadow: `0 0 12px ${color}22`,
            }}
          >
            <div style={{ color, fontFamily: "monospace", fontWeight: "bold", fontSize: "11px", marginBottom: 4 }}>
              {name}
            </div>
            <div style={{ color: "#9CA3AF", fontFamily: "monospace", fontSize: "9px", marginBottom: 2 }}>
              {statusText || "idle"}
            </div>
            {taskText && (
              <div
                style={{
                  color: "#6B7280",
                  fontFamily: "monospace",
                  fontSize: "8px",
                  marginTop: 4,
                  borderTop: "1px solid #27272A",
                  paddingTop: 4,
                  lineHeight: "1.3",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {taskText}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* ── Thought bubble (typing) ── */}
      {isTyping && !isError && !showTooltip && (
        <Html
          position={[0, 2.5 + seatYOffset, 0]}
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

      {/* ── Interaction bubble (chat / coffee / supervise) ── */}
      {interactionType && !showTooltip && (
        <Html
          position={[0, 2.5 + seatYOffset, 0]}
          center
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(20, 20, 22, 0.9)",
              borderRadius: "12px",
              padding: "3px 8px",
              display: "flex",
              gap: "4px",
              alignItems: "center",
              border: `1px solid ${color}33`,
              userSelect: "none",
              fontSize: "12px",
            }}
          >
            {interactionType === "chat" && (
              <>
                <span style={{ opacity: dotOpacity(0) }}>💬</span>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "4px",
                      height: "4px",
                      borderRadius: "50%",
                      backgroundColor: color,
                      opacity: dotOpacity(i),
                    }}
                  />
                ))}
              </>
            )}
            {interactionType === "coffee" && (
              <span>☕</span>
            )}
            {interactionType === "supervise" && (
              <span>👀</span>
            )}
          </div>
        </Html>
      )}

      {/* ── Error indicator ── */}
      {showError && (
        <Html
          position={[0, 2.5 + seatYOffset, 0]}
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

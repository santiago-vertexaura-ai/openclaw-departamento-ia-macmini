"use client";

import { useReducer } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera, Html } from "@react-three/drei";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";
import { useAgentMovement } from "./useAgentMovement";
import { ROOMS_3D, WALL_SEGMENTS, FURNITURE, DESKS_3D } from "./office-layout-3d";
import { PAL3D, AGENT_IDS, C3D, WALL_HEIGHT, WALL_THICK } from "./office-constants-3d";
import Room3D from "./Room3D";
import {
  ConfTable, Desk, Chair, Monitor, Sofa, CoffeeTable, Fridge,
  Counter, CoffeeMachine, Bookshelf, Plant, Whiteboard,
  VendingMachine, BeanBag, WaterCooler, KitchenTable,
} from "./Furniture3D";
import Agent3D from "./Agent3D";
import StatusBarOverlay from "./StatusBarOverlay";

// ── Map furniture type string to component ──
const FURNITURE_MAP: Record<string, React.ComponentType<{ position: [number, number, number]; rotation?: number; [key: string]: unknown }>> = {
  confTable: ConfTable,
  chair: Chair,
  whiteboard: Whiteboard,
  bossDesk: Desk,
  monitor: Monitor,
  execChair: Chair,
  bookshelf: Bookshelf,
  plant: Plant,
  counter: Counter,
  fridge: Fridge,
  coffeeMachine: CoffeeMachine,
  kitchenTable: KitchenTable,
  waterCooler: WaterCooler,
  sofa: Sofa,
  coffeeTable: CoffeeTable,
  vendingMachine: VendingMachine,
  beanBag: BeanBag,
};

// ── Inner scene (must be inside Canvas) ──
function Scene({ agents }: { agents: AllAgentsStatus }) {
  const { stateRef, frameRef, tick, standupRef } = useAgentMovement(agents);
  const [, invalidate] = useReducer((c: number) => c + 1, 0);

  useFrame(() => {
    tick();
    // Throttle React re-renders to ~20fps (every 3rd frame) for performance
    if (frameRef.current % 3 === 0) invalidate();
  });

  const states = stateRef.current;
  const frame = frameRef.current;

  // Sort agents by Z for depth ordering
  const sortedAgents = [...AGENT_IDS].sort(
    (a, b) => (states[a]?.z ?? 0) - (states[b]?.z ?? 0)
  );

  return (
    <>
      {/* ── Camera ── */}
      <OrthographicCamera
        makeDefault
        position={[50, 40, 50]}
        zoom={7}
        near={0.1}
        far={500}
      />
      <OrbitControls
        enableRotate
        enablePan
        enableZoom
        minZoom={5}
        maxZoom={40}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 8}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.1}
      />

      {/* ── Lighting ── */}
      <ambientLight intensity={0.6} color="#AABBDD" />
      <directionalLight
        position={[30, 50, 20]}
        intensity={0.8}
        color="#E0E8F0"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={-50}
        shadow-camera-bottom={50}
      />
      <directionalLight
        position={[-20, 30, -10]}
        intensity={0.3}
        color="#8899BB"
      />

      {/* ── Grid for depth reference ── */}
      <gridHelper args={[120, 24, "#1A2040", "#141830"]} />

      {/* ── Ground plane ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={C3D.background} />
      </mesh>

      {/* ── Rooms (floor + light + label) ── */}
      {Object.entries(ROOMS_3D).map(([key, room]) => (
        <Room3D key={key} x={room.x} z={room.z} w={room.w} d={room.d} label={room.label} />
      ))}

      {/* ── Walls ── */}
      {WALL_SEGMENTS.map((seg, i) => (
        <group key={`wall-${i}`}>
          {/* Wall body */}
          <mesh
            position={[seg.x, WALL_HEIGHT / 2, seg.z]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[
              Math.max(seg.w, WALL_THICK),
              WALL_HEIGHT,
              Math.max(seg.d, WALL_THICK),
            ]} />
            <meshStandardMaterial color={C3D.wall} />
          </mesh>
          {/* Wall top cap (lighter) */}
          <mesh position={[seg.x, WALL_HEIGHT + 0.03, seg.z]}>
            <boxGeometry args={[
              Math.max(seg.w, WALL_THICK) + 0.04,
              0.06,
              Math.max(seg.d, WALL_THICK) + 0.04,
            ]} />
            <meshStandardMaterial color={C3D.wallTop} />
          </mesh>
        </group>
      ))}

      {/* ── Furniture ── */}
      {FURNITURE.map((f, i) => {
        const Comp = FURNITURE_MAP[f.type];
        if (!Comp) return null;
        return (
          <Comp
            key={`furn-${i}`}
            position={f.position}
            rotation={f.rotation}
            {...(f.props || {})}
          />
        );
      })}

      {/* ── Agent desks (separate from furniture for monitor glow logic) ── */}
      {Object.entries(DESKS_3D).map(([id, pos]) => {
        const isWorking = id !== "santi" && agents[id as keyof AllAgentsStatus]?.status === "working";
        const pal = PAL3D[id];
        return (
          <group key={`desk-${id}`}>
            <Desk
              position={[pos.x, 0, pos.z]}
              premium={id === "alfred"}
            />
            <Monitor
              position={[pos.x, 0, pos.z - 0.3]}
              on={isWorking}
              agentColor={pal?.body}
            />
            <Chair
              position={[pos.x, 0, pos.z + 1.5]}
              active={isWorking}
            />
          </group>
        );
      })}

      {/* ── Agents ── */}
      {sortedAgents.map((id) => {
        const s = states[id];
        if (!s) return null;
        const pal = PAL3D[id];
        if (!pal) return null;

        const atTarget = Math.abs(s.x - s.targetX) < 0.3 && Math.abs(s.z - s.targetZ) < 0.3;
        const isTyping = atTarget && (s.status === "working" || s.status === "error");

        return (
          <Agent3D
            key={id}
            position={[s.x, 0, s.z]}
            color={pal.body}
            colorDark={pal.bodyDark}
            hairColor={pal.hair}
            name={pal.name}
            isTyping={isTyping}
            isError={s.status === "error"}
            walkPhase={s.walkFrame}
            breathOffset={s.breathOffset}
            isFemale={id === "marina"}
            frame={frame}
          />
        );
      })}

      {/* ── Standup indicator ── */}
      {standupRef.current.active && (() => {
        const cr = ROOMS_3D.conference;
        const cx = cr.x + cr.w / 2;
        const cz = cr.z + cr.d / 2;
        const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;

        return (
          <group>
            {/* Glowing ring on floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.05, cz]}>
              <ringGeometry args={[
                Math.max(cr.w, cr.d) / 2 - 0.5,
                Math.max(cr.w, cr.d) / 2,
                32,
              ]} />
              <meshBasicMaterial color="#3B82F6" transparent opacity={0.25 * pulse} />
            </mesh>

            {/* Banner */}
            <Html position={[cx, WALL_HEIGHT + 1, cz]} center>
              <div
                style={{
                  background: `rgba(59, 130, 246, ${0.85 * pulse})`,
                  borderRadius: 4,
                  padding: "4px 14px",
                  color: "white",
                  fontSize: 11,
                  fontWeight: "bold",
                  fontFamily: "monospace",
                  whiteSpace: "nowrap",
                  userSelect: "none",
                }}
              >
                STANDUP EN CURSO
              </div>
            </Html>
          </group>
        );
      })()}
    </>
  );
}

// ── Main export (rendered inside OfficeCanvas3D dynamic wrapper) ──
export default function Office3DScene({ agents }: { agents: AllAgentsStatus }) {
  return (
    <div className="relative h-full w-full" style={{ background: C3D.background }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "default",
          failIfMajorPerformanceCaveat: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(C3D.background);
          // Prevent context loss from killing the renderer
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("WebGL context lost — will attempt restore");
          });
          canvas.addEventListener("webglcontextrestored", () => {
            console.log("WebGL context restored");
          });
        }}
        style={{ position: "absolute", inset: 0, bottom: 44 }}
      >
        <Scene agents={agents} />
      </Canvas>
      <StatusBarOverlay agents={agents} />
    </div>
  );
}

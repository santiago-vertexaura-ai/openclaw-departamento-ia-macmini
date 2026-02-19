"use client";

import { useReducer, useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
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
import DoorFrame3D, { DOOR_POSITIONS } from "./DoorFrame3D";
import MiniMap from "./MiniMap";
import { CameraPresets, CAMERA_PRESETS } from "./CameraPresets";
import DeskObjects3D from "./DeskObjects3D";
import Confetti3D from "./Confetti3D";

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

// ── Camera animator (smooth lerp to preset, updates OrbitControls target) ──
function CameraAnimator({
  preset,
  controlsRef,
  focusTarget,
}: {
  preset: string | null;
  controlsRef: React.RefObject</* OrbitControls instance */ { target: THREE.Vector3; update: () => void } | null>;
  focusTarget: { position: THREE.Vector3; zoom: number } | null;
}) {
  const { camera } = useThree();
  const goalPos = useRef<THREE.Vector3 | null>(null);
  const goalLookAt = useRef<THREE.Vector3 | null>(null);
  const goalZoom = useRef<number | null>(null);

  // Respond to preset changes
  useEffect(() => {
    if (!preset || !CAMERA_PRESETS[preset]) return;
    const p = CAMERA_PRESETS[preset];
    goalPos.current = new THREE.Vector3(...p.position);
    goalLookAt.current = new THREE.Vector3(...p.target);
    goalZoom.current = p.zoom;
  }, [preset]);

  // Respond to focus target changes
  useEffect(() => {
    if (!focusTarget) return;
    // Camera position: offset from focus point
    goalPos.current = new THREE.Vector3(
      focusTarget.position.x + 15,
      20,
      focusTarget.position.z + 15,
    );
    goalLookAt.current = focusTarget.position.clone();
    goalZoom.current = focusTarget.zoom;
  }, [focusTarget]);

  useFrame(() => {
    if (!goalPos.current || !goalZoom.current || !goalLookAt.current) return;
    const cam = camera as THREE.OrthographicCamera;
    const controls = controlsRef.current;

    // Lerp camera position
    cam.position.lerp(goalPos.current, 0.06);
    // Lerp zoom
    cam.zoom += (goalZoom.current - cam.zoom) * 0.06;
    cam.updateProjectionMatrix();
    // Lerp OrbitControls target
    if (controls) {
      controls.target.lerp(goalLookAt.current, 0.06);
      controls.update();
    }

    // Check if close enough to stop
    const posDone = cam.position.distanceTo(goalPos.current) < 0.1;
    const zoomDone = Math.abs(cam.zoom - goalZoom.current) < 0.1;
    if (posDone && zoomDone) {
      goalPos.current = null;
      goalLookAt.current = null;
      goalZoom.current = null;
    }
  });

  return null;
}

// ── Activity tracker: detects status changes ──
interface ActivityEvent {
  agentId: string;
  type: "check" | "new";
  frame: number;
}

// ── Standup hologram component ──
function StandupHologram({ frame }: { frame: number }) {
  const cr = ROOMS_3D.conference;
  const cx = cr.x + cr.w / 2;
  const cz = cr.z + cr.d / 2;
  const pulse = Math.sin(frame * 0.06) * 0.3 + 0.7;
  const rotY = frame * 0.01; // slow rotation

  return (
    <group position={[cx, 0, cz]}>
      {/* Glowing ring on floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[
          Math.max(cr.w, cr.d) / 2 - 0.5,
          Math.max(cr.w, cr.d) / 2,
          32,
        ]} />
        <meshBasicMaterial color="#3B82F6" transparent opacity={0.25 * pulse} />
      </mesh>

      {/* Holographic projection above table */}
      <group position={[0, WALL_HEIGHT + 0.5, 0]} rotation={[0, rotY, 0]}>
        {/* Hologram base ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 24]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.3 * pulse} side={THREE.DoubleSide} />
        </mesh>
        {/* Vertical beam */}
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.02, 1.5, 2.4, 16, 1, true]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.15 * pulse} side={THREE.DoubleSide} />
        </mesh>
        {/* Floating sphere */}
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 12]} />
          <meshBasicMaterial color="#60A5FA" transparent opacity={0.4 * pulse} wireframe />
        </mesh>
      </group>
    </group>
  );
}

// ── Inner scene (must be inside Canvas) ──
function Scene({
  agents,
  selectedAgent,
  onAgentClick,
  cameraPreset,
  positionsRef,
  focusAgent,
  onFocusAgent,
}: {
  agents: AllAgentsStatus;
  selectedAgent: string | null;
  onAgentClick: (id: string | null) => void;
  cameraPreset: string | null;
  positionsRef: React.MutableRefObject<Record<string, { x: number; z: number }>>;
  focusAgent: string | null;
  onFocusAgent: (id: string | null) => void;
}) {
  const { stateRef, frameRef, tick, standupRef } = useAgentMovement(agents);
  const [, invalidate] = useReducer((c: number) => c + 1, 0);
  const controlsRef = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);
  // Track activity events (status changes)
  const prevStatusRef = useRef<Record<string, string>>({});
  const activitiesRef = useRef<ActivityEvent[]>([]);

  useFrame(() => {
    tick();
    // Sync positions to minimap ref (every 10 frames)
    if (frameRef.current % 10 === 0) {
      const st = stateRef.current;
      for (const id of AGENT_IDS) {
        if (st[id]) positionsRef.current[id] = { x: st[id].x, z: st[id].z };
      }
    }

    if (frameRef.current % 3 === 0) invalidate();

    // Track status changes for activity indicators
    const ag = agents;
    for (const id of AGENT_IDS) {
      if (id === "santi") continue;
      const curr = (ag[id as keyof typeof ag]?.status || "idle");
      const prev = prevStatusRef.current[id] || "idle";
      if (curr !== prev) {
        if (curr === "working") {
          activitiesRef.current.push({ agentId: id, type: "new", frame: frameRef.current });
        } else if (prev === "working" && curr === "idle") {
          activitiesRef.current.push({ agentId: id, type: "check", frame: frameRef.current });
        }
        prevStatusRef.current[id] = curr;
      }
    }
    // Clean old activities (> 180 frames ≈ 3s)
    activitiesRef.current = activitiesRef.current.filter(
      (a) => frameRef.current - a.frame < 180
    );
  });

  const states = stateRef.current;
  const frame = frameRef.current;

  // Sort agents by Z for depth ordering
  const sortedAgents = [...AGENT_IDS].sort(
    (a, b) => (states[a]?.z ?? 0) - (states[b]?.z ?? 0)
  );

  // Get latest activity for an agent
  const getActivity = (id: string): "check" | "new" | null => {
    const acts = activitiesRef.current.filter((a) => a.agentId === id);
    return acts.length > 0 ? acts[acts.length - 1].type : null;
  };

  return (
    <>
      {/* ── Camera ── */}
      <OrthographicCamera
        makeDefault
        position={[50, 40, 50]}
        zoom={11}
        near={0.1}
        far={500}
      />
      <OrbitControls
        ref={controlsRef as React.Ref<never>}
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
      <CameraAnimator
        preset={cameraPreset}
        controlsRef={controlsRef}
        focusTarget={focusAgent && states[focusAgent] ? {
          position: new THREE.Vector3(states[focusAgent].x, 0, states[focusAgent].z),
          zoom: 28,
        } : null}
      />

      {/* ── Click background to deselect ── */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.05, 0]}
        onClick={() => { onAgentClick(null); onFocusAgent(null); }}
        visible={false}
      >
        <planeGeometry args={[300, 300]} />
        <meshBasicMaterial />
      </mesh>

      {/* ── Lighting (fixed, bright office) ── */}
      <ambientLight intensity={1.5} color="#DDEEFF" />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.8}
        color="#F0F4FF"
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
        intensity={0.8}
        color="#CCDDFF"
      />

      {/* ── Grid for depth reference ── */}
      <gridHelper args={[120, 24, "#5A6A88", "#4A5A78"]} />

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

      {/* ── Door frames ── */}
      {DOOR_POSITIONS.map((door, i) => (
        <DoorFrame3D
          key={`door-${i}`}
          position={door.position}
          rotation={door.rotation}
        />
      ))}

      {/* ── Furniture (scaled 2x for visibility) ── */}
      {FURNITURE.map((f, i) => {
        const Comp = FURNITURE_MAP[f.type];
        if (!Comp) return null;
        const [fx, fy, fz] = f.position;
        return (
          <group key={`furn-${i}`} position={[fx, fy, fz]} scale={[2, 2, 2]}>
            <Comp
              position={[0, 0, 0]}
              rotation={f.rotation}
              {...(f.props || {})}
            />
          </group>
        );
      })}

      {/* ── Agent desks (scaled 2x for visibility) ── */}
      {Object.entries(DESKS_3D).map(([id, pos]) => {
        const isWorking = id !== "santi" && agents[id as keyof AllAgentsStatus]?.status === "working";
        const pal = PAL3D[id];
        return (
          <group key={`desk-${id}`} position={[pos.x, 0, pos.z]} scale={[2, 2, 2]}>
            <Desk
              position={[0, 0, 0]}
              premium={id === "alfred"}
            />
            <Monitor
              position={[0, 0, -0.3]}
              on={isWorking}
              agentColor={pal?.body}
            />
            <Chair
              position={[0, 0, 1.5]}
              active={isWorking}
            />
            <DeskObjects3D agentId={id} position={[0, 0, 0]} />
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
        const isSanti = id === "santi";

        // Determine if agent is seated (at desk or conference seat)
        const isSeated = isTyping && !isSanti;

        // Status + task info for tooltip
        const agentData = isSanti ? null : agents[id as keyof AllAgentsStatus];
        const statusText = isSanti
          ? "Supervisando"
          : s.status === "working"
          ? "Trabajando..."
          : s.status === "error"
          ? "Error"
          : "Descansando";
        const taskText = agentData?.lastActivityDescription || "";

        return (
          <group key={id} position={[s.x, 0, s.z]} rotation={[0, s.facing, 0]} scale={[5, 5, 5]}>
            <Agent3D
              position={[0, 0, 0]}
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
              isSeated={isSeated}
              onClick={() => {
                if (selectedAgent === id) {
                  // Second click = toggle focus
                  onFocusAgent(focusAgent === id ? null : id);
                } else {
                  onAgentClick(id);
                  onFocusAgent(null);
                }
              }}
              showTooltip={selectedAgent === id}
              statusText={statusText}
              taskText={taskText}
              activityIcon={getActivity(id)}
              interactionType={s.interaction}
            />
          </group>
        );
      })}

      {/* ── Standup hologram ── */}
      {standupRef.current.active && <StandupHologram frame={frame} />}
    </>
  );
}

// ── Main export (rendered inside OfficeCanvas3D dynamic wrapper) ──
export default function Office3DScene({ agents }: { agents: AllAgentsStatus }) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [focusAgent, setFocusAgent] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<string>("General");
  const cameraPresetRef = useRef<string | null>(null);
  const positionsRef = useRef<Record<string, { x: number; z: number }>>({});
  const [minimapTick, setMinimapTick] = useState(0);

  // ── Achievement tracking ──
  const taskCountRef = useRef<Record<string, number>>({});
  const prevAgentStatusRef = useRef<Record<string, string>>({});
  const [confettiEvents, setConfettiEvents] = useState<Array<{ agentName: string; agentColor: string; count: number; timestamp: number }>>([]);

  // Track status transitions: working → idle = task completed
  useEffect(() => {
    for (const id of AGENT_IDS) {
      if (id === "santi") continue;
      const curr = agents[id as keyof AllAgentsStatus]?.status || "idle";
      const prev = prevAgentStatusRef.current[id] || "idle";
      if (prev === "working" && curr === "idle") {
        taskCountRef.current[id] = (taskCountRef.current[id] || 0) + 1;
        const count = taskCountRef.current[id];
        // Achievement milestones: every 5 tasks
        if (count > 0 && count % 5 === 0) {
          const pal = PAL3D[id];
          if (pal) {
            setConfettiEvents((prev) => [
              ...prev.slice(-4), // keep last 5
              { agentName: pal.name, agentColor: pal.body, count, timestamp: Date.now() },
            ]);
          }
        }
      }
      prevAgentStatusRef.current[id] = curr;
    }
  }, [agents]);

  const handlePreset = useCallback((name: string) => {
    setCameraPreset(name);
    cameraPresetRef.current = name;
    setFocusAgent(null);
    setSelectedAgent(null);
    setTimeout(() => { cameraPresetRef.current = null; }, 2000);
  }, []);

  // Update minimap every 500ms
  useEffect(() => {
    const iv = setInterval(() => setMinimapTick((t) => t + 1), 500);
    return () => clearInterval(iv);
  }, []);

  // Build minimap agent data from shared positions ref
  const minimapAgents = useMemo(() => {
    const result: Record<string, { x: number; z: number; color: string; name: string }> = {};
    for (const id of AGENT_IDS) {
      const pal = PAL3D[id];
      if (!pal) continue;
      result[id] = {
        x: positionsRef.current[id]?.x ?? 0,
        z: positionsRef.current[id]?.z ?? 0,
        color: pal.body,
        name: pal.name,
      };
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minimapTick]);

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
        <Scene
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentClick={setSelectedAgent}
          cameraPreset={cameraPresetRef.current}
          positionsRef={positionsRef}
          focusAgent={focusAgent}
          onFocusAgent={setFocusAgent}
        />
      </Canvas>

      {/* ── Focus mode panel ── */}
      {focusAgent && (() => {
        const pal = PAL3D[focusAgent];
        const agentData = focusAgent !== "santi" ? agents[focusAgent as keyof AllAgentsStatus] : null;
        return (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              zIndex: 30,
              background: "rgba(10, 10, 14, 0.95)",
              borderRadius: 12,
              padding: "16px 20px",
              border: `1px solid ${pal?.body || "#3B82F6"}44`,
              minWidth: 220,
              maxWidth: 280,
              boxShadow: `0 0 20px ${pal?.body || "#3B82F6"}22`,
              fontFamily: "monospace",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: pal?.body, fontWeight: "bold", fontSize: 14 }}>
                {pal?.name || focusAgent}
              </span>
              <button
                onClick={() => { setFocusAgent(null); setSelectedAgent(null); }}
                style={{
                  background: "transparent", border: "1px solid #27272A", color: "#9CA3AF",
                  borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontFamily: "monospace", fontSize: 10,
                }}
              >
                ESC
              </button>
            </div>
            <div style={{ color: "#9CA3AF", fontSize: 11, marginBottom: 4 }}>
              Status: {agentData?.status || "idle"}
            </div>
            {agentData?.lastActivityDescription && (
              <div style={{ color: "#6B7280", fontSize: 10, marginBottom: 8, lineHeight: 1.4 }}>
                {agentData.lastActivityDescription}
              </div>
            )}
            <div style={{ borderTop: "1px solid #27272A", paddingTop: 8, color: "#6B7280", fontSize: 10 }}>
              Click empty space to exit focus
            </div>
          </div>
        );
      })()}

      {/* ── HTML Overlays ── */}
      <CameraPresets onSelect={handlePreset} activePreset={cameraPreset} />
      <MiniMap agents={minimapAgents} />
      <Confetti3D events={confettiEvents} />
      <StatusBarOverlay agents={agents} />
    </div>
  );
}

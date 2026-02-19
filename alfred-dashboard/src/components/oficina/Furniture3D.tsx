"use client";

// ── Color palette ──
const C = {
  desk: "#8098B8",
  deskPremium: "#88A0C0",
  chair: "#7888A8",
  table: "#90A8C0",
  sofa: "#B878E0",
  sofaCushion: "#CC90F0",
  fridge: "#A0B0C0",
  counter: "#8898B0",
  counterTop: "#98A8C0",
  shelf: "#8090B0",
  plantPot: "#B8986A",
  plantGreen: "#60C090",
  wall: "#7090B0",
  wallBorder: "#88A0C0",
  monitor: "#8A98B8",
};

// ── Shared prop types ──
interface BaseProps {
  position: [number, number, number];
  rotation?: number;
}

// ═══════════════════════════════════════════════════════════
// 1. ConfTable — Conference table
// ═══════════════════════════════════════════════════════════

export function ConfTable({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tabletop — brown wood */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[6, 0.1, 3.5]} />
        <meshStandardMaterial color="#6B4226" />
      </mesh>
      {/* Legs — dark wood */}
      {[
        [-2.5, 0, -1.4],
        [2.5, 0, -1.4],
        [-2.5, 0, 1.4],
        [2.5, 0, 1.4],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.375, lz]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.75, 8]} />
          <meshStandardMaterial color="#4A2E18" />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 2. Desk — Standard cubicle desk
// ═══════════════════════════════════════════════════════════

interface DeskProps extends BaseProps {
  premium?: boolean;
}

export function Desk({ position, rotation = 0, premium = false }: DeskProps) {
  const deskW = premium ? 2.5 : 2;
  const deskD = 1.2;
  const color = premium ? C.deskPremium : C.desk;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Desktop surface */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[deskW, 0.06, deskD]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* 4 legs */}
      {[
        [-(deskW / 2 - 0.1), 0, -(deskD / 2 - 0.1)],
        [(deskW / 2 - 0.1), 0, -(deskD / 2 - 0.1)],
        [-(deskW / 2 - 0.1), 0, (deskD / 2 - 0.1)],
        [(deskW / 2 - 0.1), 0, (deskD / 2 - 0.1)],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.375, lz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.75, 6]} />
          <meshStandardMaterial color="#5A6880" />
        </mesh>
      ))}

      {/* Partition walls (U-shape) */}
      <mesh position={[-(deskW / 2 + 0.1), 1, 0]} castShadow>
        <boxGeometry args={[0.05, 1.2, deskD + 0.4]} />
        <meshStandardMaterial color={C.wall} />
      </mesh>
      <mesh position={[(deskW / 2 + 0.1), 1, 0]} castShadow>
        <boxGeometry args={[0.05, 1.2, deskD + 0.4]} />
        <meshStandardMaterial color={C.wall} />
      </mesh>
      <mesh position={[0, 1, -(deskD / 2 + 0.2)]} castShadow>
        <boxGeometry args={[deskW + 0.3, 1.2, 0.05]} />
        <meshStandardMaterial color={C.wall} />
      </mesh>

      {/* Premium: L-shape + LED */}
      {premium && (
        <>
          <mesh position={[(deskW / 2 + 0.5), 0.75, -0.3]} castShadow receiveShadow>
            <boxGeometry args={[1, 0.06, 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.78, (deskD / 2)]}>
            <boxGeometry args={[deskW, 0.02, 0.03]} />
            <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.8} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 3. Chair — Office chair
// ═══════════════════════════════════════════════════════════

interface ChairProps extends BaseProps {
  color?: string;
  active?: boolean;
}

export function Chair({
  position,
  rotation = 0,
  color = C.chair,
  active = false,
}: ChairProps) {
  const seatColor = active ? "#354050" : color;

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.08, 0.5]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>
      {/* Backrest */}
      <mesh position={[0, 0.68, -0.22]} castShadow>
        <boxGeometry args={[0.5, 0.38, 0.08]} />
        <meshStandardMaterial color={seatColor} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.44, 6]} />
        <meshStandardMaterial color="#5A5A70" />
      </mesh>
      {/* Base star (5 legs) */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        return (
          <mesh
            key={i}
            position={[Math.sin(angle) * 0.2, 0.03, Math.cos(angle) * 0.2]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.06, 4]} />
            <meshStandardMaterial color="#5A5A70" />
          </mesh>
        );
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 4. Monitor — Computer monitor
// ═══════════════════════════════════════════════════════════

interface MonitorProps extends BaseProps {
  on?: boolean;
  agentColor?: string;
}

export function Monitor({
  position,
  rotation = 0,
  on = false,
  agentColor = "#3B82F6",
}: MonitorProps) {
  const screenColor = on ? "#3A5878" : "#4A5878";

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Screen */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.04]} />
        <meshStandardMaterial
          color={C.monitor}
          emissive={on ? agentColor : "#000000"}
          emissiveIntensity={on ? 0.3 : 0}
        />
      </mesh>
      {/* Screen face */}
      <mesh position={[0, 1.05, 0.025]}>
        <boxGeometry args={[0.72, 0.42, 0.005]} />
        <meshStandardMaterial
          color={screenColor}
          emissive={on ? agentColor : "#000000"}
          emissiveIntensity={on ? 0.15 : 0}
        />
      </mesh>
      {/* Stand pole */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.16, 6]} />
        <meshStandardMaterial color="#5A5A70" />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.79, 0]} receiveShadow>
        <boxGeometry args={[0.3, 0.02, 0.2]} />
        <meshStandardMaterial color="#5A5A70" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 5. Sofa — L-shaped sofa
// ═══════════════════════════════════════════════════════════

export function Sofa({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.4, 1]} />
        <meshStandardMaterial color={C.sofa} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.42]} castShadow>
        <boxGeometry args={[3, 0.5, 0.16]} />
        <meshStandardMaterial color={C.sofa} />
      </mesh>
      {/* Left armrest */}
      <mesh position={[-1.42, 0.4, 0]} castShadow>
        <boxGeometry args={[0.16, 0.4, 1]} />
        <meshStandardMaterial color={C.sofa} />
      </mesh>
      {/* L-section */}
      <mesh position={[1.3, 0.25, 0.7]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.4, 1.2]} />
        <meshStandardMaterial color={C.sofa} />
      </mesh>
      {/* Cushions */}
      <mesh position={[-0.5, 0.48, 0.05]} castShadow>
        <boxGeometry args={[0.8, 0.08, 0.7]} />
        <meshStandardMaterial color={C.sofaCushion} />
      </mesh>
      <mesh position={[0.4, 0.48, 0.05]} castShadow>
        <boxGeometry args={[0.8, 0.08, 0.7]} />
        <meshStandardMaterial color={C.sofaCushion} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 6. CoffeeTable — Low table
// ═══════════════════════════════════════════════════════════

export function CoffeeTable({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.06, 1.2]} />
        <meshStandardMaterial color={C.table} />
      </mesh>
      {[
        [-0.8, 0, -0.45],
        [0.8, 0, -0.45],
        [-0.8, 0, 0.45],
        [0.8, 0, 0.45],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.175, lz]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.35, 6]} />
          <meshStandardMaterial color="#5A6880" />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 7. Fridge — Tall box with line
// ═══════════════════════════════════════════════════════════

export function Fridge({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body — white/silver */}
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.2, 1]} />
        <meshStandardMaterial color="#D0D4DA" metalness={0.2} roughness={0.4} />
      </mesh>
      {/* Door line (horizontal split) */}
      <mesh position={[0, 1.5, 0.51]}>
        <boxGeometry args={[1.3, 0.03, 0.02]} />
        <meshStandardMaterial color="#A0A8B0" />
      </mesh>
      {/* Handle — chrome */}
      <mesh position={[0.5, 1.9, 0.55]}>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshStandardMaterial color="#B0B8C0" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, 0.7, 0.55]}>
        <boxGeometry args={[0.06, 0.4, 0.06]} />
        <meshStandardMaterial color="#B0B8C0" metalness={0.6} roughness={0.2} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 8. Counter — Kitchen counter
// ═══════════════════════════════════════════════════════════

export function Counter({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body — white cabinets */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 0.9, 1.5]} />
        <meshStandardMaterial color="#E8E8EC" />
      </mesh>
      {/* Countertop — marble/granite */}
      <mesh position={[0, 0.91, 0]} receiveShadow>
        <boxGeometry args={[8.1, 0.06, 1.6]} />
        <meshStandardMaterial color="#C8CCD4" metalness={0.1} roughness={0.3} />
      </mesh>
      {/* Cabinet handles */}
      {[-2.5, -1, 0.5, 2].map((xOff, i) => (
        <mesh key={i} position={[xOff, 0.45, 0.77]}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
          <meshStandardMaterial color="#A0A8B0" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 9. CoffeeMachine — Small box
// ═══════════════════════════════════════════════════════════

export function CoffeeMachine({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body — stainless steel espresso machine */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.6]} />
        <meshStandardMaterial color="#C0C4CC" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* Water tank — clear blue */}
      <mesh position={[0, 1.55, -0.05]}>
        <boxGeometry args={[0.5, 0.2, 0.4]} />
        <meshStandardMaterial color="#88BBDD" transparent opacity={0.5} />
      </mesh>
      {/* Front panel — dark */}
      <mesh position={[0, 1.2, 0.31]}>
        <boxGeometry args={[0.6, 0.35, 0.02]} />
        <meshStandardMaterial color="#5A5A70" />
      </mesh>
      {/* Green indicator */}
      <mesh position={[0.2, 1.25, 0.33]}>
        <sphereGeometry args={[0.04, 6, 6]} />
        <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 10. Bookshelf — Tall shelf with book blocks
// ═══════════════════════════════════════════════════════════

export function Bookshelf({ position, rotation = 0 }: BaseProps) {
  const shelfH = 2.8;
  const shelfW = 2;
  const shelfD = 0.8;
  const numShelves = 3;
  const bookColors = ["#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#10B981", "#EC4899"];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main frame */}
      <mesh position={[0, shelfH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[shelfW, shelfH, shelfD]} />
        <meshStandardMaterial color={C.shelf} />
      </mesh>
      {/* Shelf dividers */}
      {Array.from({ length: numShelves }).map((_, i) => {
        const y = ((i + 1) * shelfH) / (numShelves + 1);
        return (
          <mesh key={`shelf-${i}`} position={[0, y, 0]}>
            <boxGeometry args={[shelfW - 0.1, 0.06, shelfD - 0.1]} />
            <meshStandardMaterial color="#6A7A98" />
          </mesh>
        );
      })}
      {/* Books (deterministic sizes) */}
      {Array.from({ length: numShelves }).map((_, si) => {
        const shelfY = ((si + 1) * shelfH) / (numShelves + 1);
        return [0, 1, 2].map((bi) => {
          const bw = 0.3 + bi * 0.08;
          const bh = 0.4 + si * 0.05;
          const xOff = -0.5 + bi * 0.5;
          const color = bookColors[(si * 3 + bi) % bookColors.length];
          return (
            <mesh key={`book-${si}-${bi}`} position={[xOff, shelfY + bh / 2 + 0.04, 0.05]}>
              <boxGeometry args={[bw, bh, shelfD * 0.6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          );
        });
      })}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 11. Plant — Potted plant
// ═══════════════════════════════════════════════════════════

export function Plant({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Pot */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.22, 0.5, 8]} />
        <meshStandardMaterial color={C.plantPot} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.04, 8]} />
        <meshStandardMaterial color="#7A6A48" />
      </mesh>
      {/* Foliage (main) */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.45, 8, 8]} />
        <meshStandardMaterial color={C.plantGreen} />
      </mesh>
      {/* Foliage (smaller accent) */}
      <mesh position={[0.2, 1.15, 0.1]} castShadow>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#60A888" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 12. Whiteboard — Wall-mounted board
// ═══════════════════════════════════════════════════════════

export function Whiteboard({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh position={[0, 2.2, 0]} castShadow>
        <boxGeometry args={[3, 1.5, 0.08]} />
        <meshStandardMaterial color="#D0D0D0" />
      </mesh>
      {/* White surface */}
      <mesh position={[0, 2.2, 0.045]}>
        <boxGeometry args={[2.8, 1.3, 0.01]} />
        <meshStandardMaterial color="#F0F0F0" />
      </mesh>
      {/* Tray */}
      <mesh position={[0, 1.48, 0.08]}>
        <boxGeometry args={[1.5, 0.05, 0.12]} />
        <meshStandardMaterial color="#C0C0C0" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 13. VendingMachine — Tall box with display
// ═══════════════════════════════════════════════════════════

export function VendingMachine({ position, rotation = 0 }: BaseProps) {
  const drinkColors = ["#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899"];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main body */}
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.4, 1]} />
        <meshStandardMaterial color="#4A5568" />
      </mesh>
      {/* Display window */}
      <mesh position={[0, 1.5, 0.52]}>
        <boxGeometry args={[1.4, 1.4, 0.05]} />
        <meshStandardMaterial color="#3A4A68" />
      </mesh>
      {/* Drinks (2x3 grid) */}
      {drinkColors.map((dc, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        return (
          <mesh key={i} position={[-0.35 + col * 0.35, 1.8 - row * 0.5, 0.4]}>
            <boxGeometry args={[0.2, 0.3, 0.15]} />
            <meshStandardMaterial color={dc} />
          </mesh>
        );
      })}
      {/* Dispenser */}
      <mesh position={[0, 0.3, 0.52]}>
        <boxGeometry args={[0.8, 0.4, 0.05]} />
        <meshStandardMaterial color="#4A4A60" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 14. BeanBag — Flattened sphere
// ═══════════════════════════════════════════════════════════

interface BeanBagProps extends BaseProps {
  color?: string;
}

export function BeanBag({
  position,
  rotation = 0,
  color = "#5A3E78",
}: BeanBagProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} scale={[1, 0.4, 1]} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 15. WaterCooler — Thin box with blue sphere on top
// ═══════════════════════════════════════════════════════════

export function WaterCooler({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 1.2, 0.6]} />
        <meshStandardMaterial color="#E8E8E8" />
      </mesh>
      {/* Water jug (blue sphere on top) */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.25, 10, 10]} />
        <meshStandardMaterial color="#2563EB" transparent opacity={0.5} />
      </mesh>
      {/* Spout */}
      <mesh position={[0, 0.5, 0.33]}>
        <boxGeometry args={[0.1, 0.06, 0.06]} />
        <meshStandardMaterial color="#4A5568" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════
// 16. KitchenTable — Small dining table
// ═══════════════════════════════════════════════════════════

export function KitchenTable({ position, rotation = 0 }: BaseProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tabletop — light wood */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.06, 1.4]} />
        <meshStandardMaterial color="#C4A882" />
      </mesh>
      {/* Legs — natural wood */}
      {[
        [-0.8, 0, -0.55],
        [0.8, 0, -0.55],
        [-0.8, 0, 0.55],
        [0.8, 0, 0.55],
      ].map(([lx, , lz], i) => (
        <mesh key={i} position={[lx, 0.375, lz]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.75, 6]} />
          <meshStandardMaterial color="#A08860" />
        </mesh>
      ))}
    </group>
  );
}

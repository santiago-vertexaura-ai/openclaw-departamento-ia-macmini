"use client";

interface DeskObjects3DProps {
  agentId: string;
  position: [number, number, number];
}

// ── Alfred — Orchestrator (#3B82F6) ──
function AlfredObjects() {
  return (
    <>
      {/* Holographic org chart — semi-transparent glowing cube */}
      <mesh position={[0.3, 1.1, -0.1]} castShadow>
        <boxGeometry args={[0.15, 0.15, 0.15]} />
        <meshStandardMaterial
          color="#3B82F6"
          emissive="#3B82F6"
          emissiveIntensity={0.6}
          transparent
          opacity={0.4}
          wireframe
        />
      </mesh>
      {/* Inner solid core for glow effect */}
      <mesh position={[0.3, 1.1, -0.1]}>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial
          color="#3B82F6"
          emissive="#3B82F6"
          emissiveIntensity={0.8}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Nameplate */}
      <mesh position={[0, 0.83, 0.5]} castShadow>
        <boxGeometry args={[0.4, 0.06, 0.12]} />
        <meshStandardMaterial
          color="#1A2A4A"
          emissive="#3B82F6"
          emissiveIntensity={0.2}
        />
      </mesh>
    </>
  );
}

// ── Roberto — Researcher (#8B5CF6) ──
function RobertoObjects() {
  return (
    <>
      {/* Globe — wireframe sphere */}
      <mesh position={[0.5, 0.95, 0.2]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#4A3078" wireframe />
      </mesh>
      {/* Globe solid core */}
      <mesh position={[0.5, 0.95, 0.2]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#8B5CF6"
          emissive="#8B5CF6"
          emissiveIntensity={0.2}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Stack of papers — 3 flat boxes */}
      <mesh position={[-0.3, 0.82, 0.3]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.15]} />
        <meshStandardMaterial color="#E8E8E8" />
      </mesh>
      <mesh position={[-0.3, 0.84, 0.3]} rotation={[0, -0.05, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.15]} />
        <meshStandardMaterial color="#E0E0E0" />
      </mesh>
      <mesh position={[-0.3, 0.86, 0.3]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.25, 0.02, 0.15]} />
        <meshStandardMaterial color="#D8D8D8" />
      </mesh>
    </>
  );
}

// ── Andrés — Content Intelligence (#F59E0B) ──
function AndresObjects() {
  return (
    <>
      {/* Mini bar chart — 3 bars of different heights */}
      <mesh position={[0.34, 0.85, 0.3]}>
        <boxGeometry args={[0.06, 0.1, 0.06]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      <mesh position={[0.4, 0.875, 0.3]}>
        <boxGeometry args={[0.06, 0.15, 0.06]} />
        <meshStandardMaterial color="#D97706" />
      </mesh>
      <mesh position={[0.46, 0.9, 0.3]}>
        <boxGeometry args={[0.06, 0.2, 0.06]} />
        <meshStandardMaterial color="#B45309" />
      </mesh>
      {/* Chart base */}
      <mesh position={[0.4, 0.8, 0.3]}>
        <boxGeometry args={[0.22, 0.01, 0.08]} />
        <meshStandardMaterial color="#444444" />
      </mesh>

      {/* Calculator */}
      <mesh position={[-0.3, 0.82, 0.2]}>
        <boxGeometry args={[0.12, 0.02, 0.08]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Calculator screen */}
      <mesh position={[-0.3, 0.831, 0.175]}>
        <boxGeometry args={[0.09, 0.005, 0.025]} />
        <meshStandardMaterial
          color="#1A3A1A"
          emissive="#22C55E"
          emissiveIntensity={0.3}
        />
      </mesh>
    </>
  );
}

// ── Marina — Content Creator (#EC4899) ──
function MarinaObjects() {
  return (
    <>
      {/* Paint palette — flat cylinder */}
      <mesh position={[0.4, 0.82, 0.3]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
        <meshStandardMaterial color="#F5F0E0" />
      </mesh>
      {/* Paint dots on palette */}
      <mesh position={[0.36, 0.835, 0.26]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#EC4899" />
      </mesh>
      <mesh position={[0.44, 0.835, 0.26]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
      <mesh position={[0.36, 0.835, 0.34]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#22C55E" />
      </mesh>
      <mesh position={[0.44, 0.835, 0.34]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>

      {/* Mini succulent — pot */}
      <mesh position={[-0.4, 0.83, 0.2]}>
        <cylinderGeometry args={[0.04, 0.035, 0.06, 8]} />
        <meshStandardMaterial color="#6B4226" />
      </mesh>
      {/* Succulent foliage */}
      <mesh position={[-0.4, 0.89, 0.2]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#3DA070" />
      </mesh>
    </>
  );
}

// ── Arturo — Marketing (#EAB308) ──
function ArturoObjects() {
  return (
    <>
      {/* Coffee mug */}
      <mesh position={[0.5, 0.86, 0.3]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.08, 10]} />
        <meshStandardMaterial color="#E8E0D0" />
      </mesh>
      {/* Mug handle */}
      <mesh position={[0.545, 0.86, 0.3]}>
        <torusGeometry args={[0.02, 0.008, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#E8E0D0" />
      </mesh>
      {/* Steam wisps — transparent white spheres */}
      <mesh position={[0.49, 0.94, 0.29]}>
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.51, 0.97, 0.31]}>
        <sphereGeometry args={[0.012, 6, 6]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.2} />
      </mesh>

      {/* Headphones */}
      <mesh position={[-0.4, 0.84, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.06, 0.015, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      {/* Ear cushions */}
      <mesh position={[-0.46, 0.84, 0.2]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#3A3A3A" />
      </mesh>
      <mesh position={[-0.34, 0.84, 0.2]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#3A3A3A" />
      </mesh>
    </>
  );
}

// ── Alex — Analytics (#EF4444) ──
function AlexObjects() {
  return (
    <>
      {/* Energy drink can */}
      <mesh position={[0.5, 0.87, 0.3]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, 0.1, 10]} />
        <meshStandardMaterial
          color="#EF4444"
          emissive="#EF4444"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Can top */}
      <mesh position={[0.5, 0.921, 0.3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.005, 10]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Stress ball */}
      <mesh position={[-0.3, 0.84, 0.2]}>
        <sphereGeometry args={[0.04, 10, 10]} />
        <meshStandardMaterial color="#3B82F6" />
      </mesh>
    </>
  );
}

// ── Santi — Boss (#10B981) ──
function SantiObjects() {
  return (
    <>
      {/* Photo frame — outer */}
      <mesh position={[0.4, 0.9, -0.2]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.12, 0.15, 0.02]} />
        <meshStandardMaterial color="#8B7355" />
      </mesh>
      {/* Photo frame — inner face (photo placeholder) */}
      <mesh position={[0.4, 0.9, -0.189]} rotation={[-0.2, 0, 0]}>
        <boxGeometry args={[0.09, 0.11, 0.005]} />
        <meshStandardMaterial color="#445566" />
      </mesh>

      {/* Nameplate */}
      <mesh position={[0, 0.83, 0.5]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.1]} />
        <meshStandardMaterial
          color="#1A2A1A"
          emissive="#10B981"
          emissiveIntensity={0.15}
        />
      </mesh>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════

export default function DeskObjects3D({
  agentId,
  position,
}: DeskObjects3DProps) {
  let objects: React.ReactNode = null;

  switch (agentId) {
    case "alfred":
      objects = <AlfredObjects />;
      break;
    case "roberto":
      objects = <RobertoObjects />;
      break;
    case "andres":
      objects = <AndresObjects />;
      break;
    case "marina":
      objects = <MarinaObjects />;
      break;
    case "arturo":
      objects = <ArturoObjects />;
      break;
    case "alex":
      objects = <AlexObjects />;
      break;
    case "santi":
      objects = <SantiObjects />;
      break;
    default:
      return null;
  }

  return <group position={position}>{objects}</group>;
}

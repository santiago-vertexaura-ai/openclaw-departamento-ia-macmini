// ── Color palette (matching dashboard dark theme) ──
export const C3D = {
  floor: "#4A5E78",
  floorB: "#546888",
  carpet: "#5A4880",
  wall: "#7A96B8",
  wallTop: "#90AAC8",
  wallBorder: "#90AAC8",
  desk: "#8098B8",
  deskPremium: "#88A0C0",
  deskBorder: "#7A96B8",
  chair: "#7888A8",
  chairActive: "#8A9CC0",
  monitorOff: "#5A6A88",
  monitorOn: "#6A80A8",
  monitorScreen: "#4A68A0",
  monitorFrame: "#8A98B8",
  sofa: "#8A70B0",
  sofaCushion: "#A080C0",
  table: "#7A96B8",
  fridge: "#A0B0C0",
  counter: "#7A8AA0",
  counterTop: "#90A0B8",
  shelf: "#6A7A98",
  plantPot: "#B8986A",
  plantGreen: "#6AB898",
  plantLight: "#7AC8A8",
  whiteboard: "#F4F4F4",
  skin: "#D4A574",
  skinShadow: "#B88A5E",
  pants: "#606080",
  shoes: "#707088",
  background: "#1A2030",
};

// ── Agent palettes ──
export interface AgentPal {
  body: string;
  bodyDark: string;
  hair: string;
  name: string;
}

export const PAL3D: Record<string, AgentPal> = {
  alfred:  { body: "#3B82F6", bodyDark: "#2563EB", hair: "#1D4ED8", name: "Alfred" },
  roberto: { body: "#8B5CF6", bodyDark: "#7C3AED", hair: "#6D28D9", name: "Roberto" },
  andres:  { body: "#F59E0B", bodyDark: "#D97706", hair: "#B45309", name: "Andrés" },
  santi:   { body: "#10B981", bodyDark: "#059669", hair: "#1A1A2E", name: "Santi" },
  marina:  { body: "#EC4899", bodyDark: "#DB2777", hair: "#BE185D", name: "Marina" },
  arturo:  { body: "#EAB308", bodyDark: "#CA8A04", hair: "#A16207", name: "Arturo" },
  alex:    { body: "#EF4444", bodyDark: "#DC2626", hair: "#991B1B", name: "Alex" },
};

// ── Agent IDs (draw order) ──
export const AGENT_IDS = ["alfred", "roberto", "andres", "marina", "arturo", "alex", "santi"] as const;

// ── 3D sizes ──
export const WALL_HEIGHT = 3.5;
export const WALL_THICK = 0.3;
export const FLOOR_Y = 0;

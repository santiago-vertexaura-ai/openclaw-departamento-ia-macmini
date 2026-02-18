// ── Color palette (matching dashboard dark theme) ──
export const C3D = {
  floor: "#0C1018",
  floorB: "#141C26",
  carpet: "#161222",
  wall: "#1B2230",
  wallTop: "#2E3A4E",
  wallBorder: "#2E3848",
  desk: "#212B3C",
  deskPremium: "#283648",
  deskBorder: "#2A3545",
  chair: "#2A3040",
  chairActive: "#354050",
  monitorOff: "#181E28",
  monitorOn: "#1E3050",
  monitorScreen: "#0F2840",
  monitorFrame: "#333D4D",
  sofa: "#2A1E3A",
  sofaCushion: "#352850",
  table: "#1C2838",
  fridge: "#303840",
  counter: "#1E2530",
  counterTop: "#283040",
  shelf: "#1A2230",
  plantPot: "#5A3E2A",
  plantGreen: "#1E5038",
  plantLight: "#2A6848",
  whiteboard: "#F0F0F0",
  skin: "#D4A574",
  skinShadow: "#B88A5E",
  pants: "#1A1A2E",
  shoes: "#252530",
  background: "#060810",
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

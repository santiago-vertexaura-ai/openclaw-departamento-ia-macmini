// ── Coordinate conversion: 2D pixels → 3D world units ──
// 1 unit = 10 px, centered at origin for OrbitControls
const CX = 550; // W/2
const CZ = 338; // OFFICE_H/2
const S = 0.1;  // scale factor

function px(x: number, y: number): [number, number] {
  return [(x - CX) * S, (y - CZ) * S];
}

// ── Room definitions ──
export interface Room3DDef {
  x: number; z: number; w: number; d: number;
  label: string;
  floorColor?: string;
}

const [confX, confZ] = px(15, 15);
const [bossX, bossZ] = px(15, 235);
const [kitchenX, kitchenZ] = px(15, 420);
const [cubX, cubZ] = px(315, 15);
const [loungeX, loungeZ] = px(315, 335);

export const ROOMS_3D: Record<string, Room3DDef> = {
  conference: { x: confX, z: confZ, w: 29, d: 21, label: "SALA DE REUNIONES" },
  boss:       { x: bossX, z: bossZ, w: 29, d: 17.5, label: "DESPACHO SANTI" },
  kitchen:    { x: kitchenX, z: kitchenZ, w: 29, d: 25.6, label: "COCINA" },
  cubicles:   { x: cubX, z: cubZ, w: 78.5, d: 31, label: "ZONA DE TRABAJO" },
  lounge:     { x: loungeX, z: loungeZ, w: 78.5, d: 34.1, label: "LOUNGE" },
};

// ── Desk positions (3D) ──
export interface Pos3D { x: number; z: number; }

function pxPos(x2d: number, y2d: number): Pos3D {
  const [x, z] = px(x2d, y2d);
  return { x, z };
}

export const DESKS_3D: Record<string, Pos3D> = {
  alfred:  pxPos(430, 100),
  roberto: pxPos(610, 100),
  andres:  pxPos(790, 100),
  marina:  pxPos(960, 100),
  arturo:  pxPos(520, 210),
  alex:    pxPos(700, 210),
};

// ── Agent working offsets (where they sit relative to desk) ──
export function deskSitPos(id: string): Pos3D {
  const d = DESKS_3D[id];
  if (!d) return { x: 0, z: 0 };
  return { x: d.x + 1, z: d.z + 5.8 }; // offset = (10, 58) in 2D → (1, 5.8) in 3D
}

// ── Idle home positions ──
export const IDLE_POS_3D: Record<string, Pos3D> = {
  alfred:  pxPos(500, 490),
  roberto: pxPos(680, 510),
  andres:  pxPos(150, 530),
  santi:   pxPos(120, 330),
  marina:  pxPos(860, 540),
  arturo:  pxPos(380, 480),
  alex:    pxPos(950, 500),
};

// ── Conference room seats (for standups) ──
export const CONF_SEATS_3D: Record<string, Pos3D> = {
  santi:   pxPos(53, 107),
  alfred:  pxPos(95, 63),
  roberto: pxPos(155, 63),
  andres:  pxPos(210, 63),
  marina:  pxPos(95, 173),
  arturo:  pxPos(155, 173),
  alex:    pxPos(210, 173),
};

// ── Wandering waypoints ──
export const WANDER_POINTS_3D: Pos3D[] = [
  // Lounge area
  pxPos(420, 460), pxPos(550, 500), pxPos(680, 480),
  pxPos(500, 540), pxPos(620, 560), pxPos(750, 510),
  pxPos(450, 580), pxPos(380, 520),
  // Kitchen area
  pxPos(100, 470), pxPos(180, 510), pxPos(200, 560),
  pxPos(130, 600), pxPos(80, 540),
  // Conference room
  pxPos(100, 100), pxPos(180, 140), pxPos(220, 80),
  // Near cubicles hallway
  pxPos(400, 280), pxPos(550, 300), pxPos(700, 290),
];

export const SANTI_WANDER_3D: Pos3D[] = [
  pxPos(120, 330), pxPos(200, 290), pxPos(80, 360),
  pxPos(160, 380),
  pxPos(100, 100), pxPos(180, 140),
  pxPos(500, 490), pxPos(420, 460),
  pxPos(150, 530),
];

// ── Wall segments ──
// Each wall: start [x,z], end [x,z] → will be rendered as a box
export interface WallSeg {
  x: number; z: number; // center position
  w: number; d: number; // width (X) and depth (Z)
}

// Outer walls (2D: 12px border → offset by 1.2 units from edge)
const [outerL, outerT] = px(12, 12);
const [outerR, outerB] = px(1088, 664);
const officeW = outerR - outerL;
const officeD = outerB - outerT;

// Main divider at 2D x=310
const [divX] = px(310, 0);

// Horizontal dividers
const [, confBossZ] = px(0, 230);
const [, bossKitZ] = px(0, 418);
const [, cubLoungeZ] = px(0, 332);

export const WALL_SEGMENTS: WallSeg[] = [
  // ── Outer walls ──
  // Top (north)
  { x: outerL + officeW / 2, z: outerT, w: officeW, d: 0.3 },
  // Bottom (south)
  { x: outerL + officeW / 2, z: outerB, w: officeW, d: 0.3 },
  // Left (west)
  { x: outerL, z: outerT + officeD / 2, w: 0.3, d: officeD },
  // Right (east)
  { x: outerR, z: outerT + officeD / 2, w: 0.3, d: officeD },

  // ── Main vertical divider (x=310) ──
  { x: divX, z: outerT + officeD / 2, w: 0.3, d: officeD },

  // ── Conference / Boss divider (y=230, left section) ──
  // Split for door gap at x=248-302 (2D) → gap at about x=-30.2 to -24.8
  { x: outerL + (divX - outerL) * 0.35, z: confBossZ, w: (divX - outerL) * 0.7, d: 0.3 },
  { x: divX - 1, z: confBossZ, w: 2.5, d: 0.3 },

  // ── Boss / Kitchen divider (y=418, left section) ──
  { x: outerL + (divX - outerL) * 0.35, z: bossKitZ, w: (divX - outerL) * 0.7, d: 0.3 },
  { x: divX - 1, z: bossKitZ, w: 2.5, d: 0.3 },

  // ── Cubicles / Lounge divider (y=332, right section) ──
  // Door gap at x=488-552 (2D) → gap around x=-6.2 to 0.2
  { x: divX + 5, z: cubLoungeZ, w: 12, d: 0.3 },
  { x: divX + 25, z: cubLoungeZ, w: 20, d: 0.3 },
  { x: outerR - 10, z: cubLoungeZ, w: 22, d: 0.3 },
];

// ── Furniture layout for each room ──
export interface FurniturePlacement {
  type: string;
  position: [number, number, number]; // [x, y, z]
  rotation?: number; // Y rotation in radians
  scale?: [number, number, number];
  props?: Record<string, unknown>;
}

// Helper: 2D pos → 3D pos on floor
function p3(x2d: number, y2d: number, yOff = 0): [number, number, number] {
  const [x, z] = px(x2d, y2d);
  return [x, yOff, z];
}

export const FURNITURE: FurniturePlacement[] = [
  // ── Conference Room ──
  { type: "confTable", position: p3(150, 118) },
  // Chairs around table
  { type: "chair", position: p3(95, 63) },
  { type: "chair", position: p3(155, 63) },
  { type: "chair", position: p3(210, 63) },
  { type: "chair", position: p3(95, 173), rotation: Math.PI },
  { type: "chair", position: p3(155, 173), rotation: Math.PI },
  { type: "chair", position: p3(210, 173), rotation: Math.PI },
  { type: "chair", position: p3(53, 107), rotation: Math.PI / 2 },
  { type: "chair", position: p3(247, 107), rotation: -Math.PI / 2 },
  { type: "whiteboard", position: p3(155, 35) },

  // ── Boss Office ──
  { type: "bossDesk", position: p3(100, 290) },
  { type: "monitor", position: p3(108, 290), props: { on: true } },
  { type: "execChair", position: p3(100, 360) },
  { type: "bookshelf", position: p3(225, 270) },
  { type: "plant", position: p3(155, 300), scale: [0.8, 0.8, 0.8] },

  // ── Kitchen ──
  { type: "counter", position: p3(155, 448) },
  { type: "fridge", position: p3(47, 478) },
  { type: "coffeeMachine", position: p3(207, 444) },
  { type: "kitchenTable", position: p3(145, 570) },
  { type: "chair", position: p3(115, 555) },
  { type: "chair", position: p3(163, 555) },
  { type: "chair", position: p3(115, 620), rotation: Math.PI },
  { type: "chair", position: p3(163, 620), rotation: Math.PI },
  { type: "waterCooler", position: p3(255, 492) },

  // ── Cubicles ── (desks handled separately via DESKS_3D)

  // ── Lounge ──
  { type: "sofa", position: p3(430, 405) },
  { type: "coffeeTable", position: p3(490, 480) },
  { type: "plant", position: p3(655, 390), scale: [1.2, 1.2, 1.2] },
  { type: "plant", position: p3(895, 585), scale: [0.7, 0.7, 0.7] },
  { type: "vendingMachine", position: p3(940, 370) },
  { type: "beanBag", position: p3(785, 565), props: { color: "#3B6090" } },
  { type: "beanBag", position: p3(855, 585), props: { color: "#6B3B78" } },
];

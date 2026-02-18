"use client";

import { useRef, useEffect, useCallback } from "react";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";

// ── Layout ──
const PX = 2; // pixel scale
const W = 1100;
const H = 720;
const BAR_H = 44;
const OFFICE_H = H - BAR_H;

// ── Palette ──
const C = {
  floorA: "#0C1018", floorB: "#141C26",
  floorAccent: "#0F141D",
  wallOuter: "#1B2230", wallInner: "#252D3A", wallBorder: "#2E3848",
  wallShadow: "rgba(0,0,0,0.25)",
  desk: "#1A2030", deskTop: "#212B3C", deskBorder: "#2A3545",
  chair: "#2A3040", chairActive: "#354050",
  monitorOff: "#181E28", monitorOn: "#1E3050", monitorScreen: "#0F2840",
  monitorFrame: "#333D4D",
  sofa: "#2A1E3A", sofaCushion: "#352850", sofaArm: "#231838",
  carpet: "#161222", carpetB: "#1A1528",
  plantPot: "#5A3E2A", plantGreen: "#1E5038", plantLight: "#2A6848",
  fridge: "#303840", fridgeDark: "#252D35",
  counter: "#1E2530", counterTop: "#283040",
  table: "#1C2838", tableBorder: "#253040",
  shelf: "#1A2230", shelfBook: "#2A1828",
  skin: "#D4A574", skinShadow: "#B88A5E",
  pants: "#1A1A2E", shoes: "#252530",
  eyeColor: "#1A1A2E",
  labelBg: "rgba(10, 14, 22, 0.80)",
  signBg: "#0E1420",
};

// ── Agent palettes ──
interface Pal { body: string; bodyDark: string; hair: string; glow: string; glowStrong: string; name: string; }
const PAL: Record<string, Pal> = {
  alfred:  { body: "#3B82F6", bodyDark: "#2563EB", hair: "#1D4ED8", glow: "rgba(59,130,246,0.15)", glowStrong: "rgba(59,130,246,0.35)", name: "Alfred" },
  roberto: { body: "#8B5CF6", bodyDark: "#7C3AED", hair: "#6D28D9", glow: "rgba(139,92,246,0.15)", glowStrong: "rgba(139,92,246,0.35)", name: "Roberto" },
  andres:  { body: "#F59E0B", bodyDark: "#D97706", hair: "#B45309", glow: "rgba(245,158,11,0.15)", glowStrong: "rgba(245,158,11,0.35)", name: "Andrés" },
  santi:   { body: "#10B981", bodyDark: "#059669", hair: "#1A1A2E", glow: "rgba(16,185,129,0.15)", glowStrong: "rgba(16,185,129,0.35)", name: "Santi" },
  marina:  { body: "#EC4899", bodyDark: "#DB2777", hair: "#BE185D", glow: "rgba(236,72,153,0.15)", glowStrong: "rgba(236,72,153,0.35)", name: "Marina" },
  arturo:  { body: "#EAB308", bodyDark: "#CA8A04", hair: "#A16207", glow: "rgba(234,179,8,0.15)", glowStrong: "rgba(234,179,8,0.35)", name: "Arturo" },
  alex:    { body: "#EF4444", bodyDark: "#DC2626", hair: "#991B1B", glow: "rgba(239,68,68,0.15)", glowStrong: "rgba(239,68,68,0.35)", name: "Alex" },
};

// ── Room layout ──
const ROOMS = {
  conference: { x: 15, y: 15, w: 290, h: 210, label: "SALA DE REUNIONES" },
  boss:       { x: 15, y: 235, w: 290, h: 175, label: "DESPACHO SANTI" },
  kitchen:    { x: 15, y: 420, w: 290, h: OFFICE_H - 430, label: "COCINA" },
  cubicles:   { x: 315, y: 15, w: W - 330, h: 310, label: "ZONA DE TRABAJO" },
  lounge:     { x: 315, y: 335, w: W - 330, h: OFFICE_H - 345, label: "LOUNGE" },
};

const DESKS: Record<string, { x: number; y: number }> = {
  alfred:  { x: 430, y: 100 },
  roberto: { x: 610, y: 100 },
  andres:  { x: 790, y: 100 },
  marina:  { x: 960, y: 100 },
  arturo:  { x: 520, y: 210 },
  alex:    { x: 700, y: 210 },
};

const IDLE_POS: Record<string, { x: number; y: number }> = {
  alfred:  { x: 500, y: 490 },
  roberto: { x: 680, y: 510 },
  andres:  { x: 150, y: 530 },
  santi:   { x: 120, y: 330 },
  marina:  { x: 860, y: 540 },
  arturo:  { x: 380, y: 480 },
  alex:    { x: 950, y: 500 },
};

// ── Wandering waypoints (idle zones) ──
const WANDER_POINTS: { x: number; y: number }[] = [
  // Lounge area
  { x: 420, y: 460 }, { x: 550, y: 500 }, { x: 680, y: 480 },
  { x: 500, y: 540 }, { x: 620, y: 560 }, { x: 750, y: 510 },
  { x: 450, y: 580 }, { x: 380, y: 520 },
  // Kitchen area
  { x: 100, y: 470 }, { x: 180, y: 510 }, { x: 200, y: 560 },
  { x: 130, y: 600 }, { x: 80, y: 540 },
  // Conference room
  { x: 100, y: 100 }, { x: 180, y: 140 }, { x: 220, y: 80 },
  // Near cubicles hallway
  { x: 400, y: 280 }, { x: 550, y: 300 }, { x: 700, y: 290 },
];

// Santi wanders mostly in boss office + conference
const SANTI_WANDER: { x: number; y: number }[] = [
  { x: 120, y: 330 }, { x: 200, y: 290 }, { x: 80, y: 360 },
  { x: 160, y: 380 }, // boss office
  { x: 100, y: 100 }, { x: 180, y: 140 }, // conference
  { x: 500, y: 490 }, { x: 420, y: 460 }, // lounge (occasional)
  { x: 150, y: 530 }, // kitchen (coffee break)
];

// ── Conference room seats (for standups) ──
const CONF_SEATS: Record<string, { x: number; y: number }> = {
  santi:   { x: 53, y: 107 },   // head of table (left side)
  alfred:  { x: 95, y: 63 },    // top row
  roberto: { x: 155, y: 63 },
  andres:  { x: 210, y: 63 },
  marina:  { x: 95, y: 173 },   // bottom row
  arturo:  { x: 155, y: 173 },
  alex:    { x: 210, y: 173 },
};

// ── Agent state ──
interface AgentState {
  x: number; y: number;
  targetX: number; targetY: number;
  status: "idle" | "working" | "error";
  walkFrame: number; typingFrame: number;
  breathOffset: number;
  idleAction: number;
  wanderTimer: number; // frames until next wander
  wanderPause: number; // frames to pause at destination
}

function makeAgent(pos: { x: number; y: number }): AgentState {
  return {
    x: pos.x, y: pos.y, targetX: pos.x, targetY: pos.y,
    status: "idle", walkFrame: 0, typingFrame: 0,
    breathOffset: Math.random() * 100, idleAction: 0,
    wanderTimer: Math.floor(30 + Math.random() * 60), // 1-3 sec initial delay (start moving fast)
    wanderPause: 0,
  };
}

// ── Helpers ──
function ellipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}

// ── Floor ──
function drawFloor(ctx: CanvasRenderingContext2D) {
  const tile = 20;
  for (let y = 0; y < OFFICE_H; y += tile) {
    // Perspective: tiles get slightly brighter toward bottom (closer to camera)
    const perspBright = 0.6 + (y / OFFICE_H) * 0.4;
    for (let x = 0; x < W; x += tile) {
      const checker = ((x / tile | 0) + (y / tile | 0)) % 2 === 0;
      const baseR = checker ? 12 : 20;
      const baseG = checker ? 16 : 28;
      const baseB = checker ? 24 : 38;
      ctx.fillStyle = `rgb(${Math.round(baseR * perspBright)}, ${Math.round(baseG * perspBright)}, ${Math.round(baseB * perspBright)})`;
      ctx.fillRect(x, y, tile, tile);
      // Grid lines (lighter at bottom = closer)
      ctx.fillStyle = `rgba(255,255,255,${0.015 + (y / OFFICE_H) * 0.02})`;
      ctx.fillRect(x, y, tile, 1);
      ctx.fillRect(x, y, 1, tile);
    }
  }
  // Lounge carpet
  const lr = ROOMS.lounge;
  for (let y = lr.y + 60; y < lr.y + lr.h - 20; y += tile) {
    for (let x = lr.x + 40; x < lr.x + 320; x += tile) {
      ctx.fillStyle = ((x / tile | 0) + (y / tile | 0)) % 2 === 0 ? C.carpet : C.carpetB;
      ctx.fillRect(x, y, tile, tile);
    }
  }

  // ── Ambient occlusion: darken floor near walls ──
  const aoSize = 18;
  const aoAlpha = 0.2;
  // Top wall
  const aoTop = ctx.createLinearGradient(0, 12, 0, 12 + aoSize);
  aoTop.addColorStop(0, `rgba(0,0,0,${aoAlpha})`);
  aoTop.addColorStop(1, "transparent");
  ctx.fillStyle = aoTop;
  ctx.fillRect(12, 12, W - 24, aoSize);
  // Left wall
  const aoLeft = ctx.createLinearGradient(12, 0, 12 + aoSize, 0);
  aoLeft.addColorStop(0, `rgba(0,0,0,${aoAlpha})`);
  aoLeft.addColorStop(1, "transparent");
  ctx.fillStyle = aoLeft;
  ctx.fillRect(12, 12, aoSize, OFFICE_H - 18);
  // Right wall
  const aoRight = ctx.createLinearGradient(W - 12, 0, W - 12 - aoSize, 0);
  aoRight.addColorStop(0, `rgba(0,0,0,${aoAlpha})`);
  aoRight.addColorStop(1, "transparent");
  ctx.fillStyle = aoRight;
  ctx.fillRect(W - 12 - aoSize, 12, aoSize, OFFICE_H - 18);
  // Main divider (vertical at x=310)
  const aoDivR = ctx.createLinearGradient(310, 0, 310 + aoSize, 0);
  aoDivR.addColorStop(0, `rgba(0,0,0,${aoAlpha * 0.7})`);
  aoDivR.addColorStop(1, "transparent");
  ctx.fillStyle = aoDivR;
  ctx.fillRect(310, 12, aoSize, OFFICE_H - 17);
  const aoDivL = ctx.createLinearGradient(310, 0, 310 - aoSize, 0);
  aoDivL.addColorStop(0, `rgba(0,0,0,${aoAlpha * 0.7})`);
  aoDivL.addColorStop(1, "transparent");
  ctx.fillStyle = aoDivL;
  ctx.fillRect(310 - aoSize, 12, aoSize, OFFICE_H - 17);
  // Horizontal dividers AO
  for (const dy of [230, 418, 332]) {
    const aoH = ctx.createLinearGradient(0, dy, 0, dy + aoSize);
    aoH.addColorStop(0, `rgba(0,0,0,${aoAlpha * 0.6})`);
    aoH.addColorStop(1, "transparent");
    ctx.fillStyle = aoH;
    if (dy === 332) ctx.fillRect(310, dy, W - 322, aoSize);
    else ctx.fillRect(12, dy, 298, aoSize);
  }
}

// ── 3D Wall helper: draws a wall with visible height ──
const WALL_HEIGHT = 8; // visible wall thickness (3D effect)
function draw3DWallH(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // Side face (darker, visible below the top)
  ctx.fillStyle = "#1A2030";
  ctx.fillRect(x, y, w, WALL_HEIGHT);
  // Top face (lighter, the "top" of the wall)
  ctx.fillStyle = "#2E3A4E";
  ctx.fillRect(x, y - 2, w, 3);
  // Highlight edge
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x, y - 2, w, 1);
  // Bottom edge shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x, y + WALL_HEIGHT - 1, w, 2);
}

function draw3DWallV(ctx: CanvasRenderingContext2D, x: number, y: number, h: number) {
  // Side face
  ctx.fillStyle = "#1A2030";
  ctx.fillRect(x, y, WALL_HEIGHT, h);
  // Left edge (lighter = "top face" of vertical wall)
  ctx.fillStyle = "#2E3A4E";
  ctx.fillRect(x - 2, y, 3, h);
  // Highlight
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(x - 2, y, 1, h);
  // Right shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(x + WALL_HEIGHT - 1, y, 2, h);
}

// ── Walls ──
function drawWalls(ctx: CanvasRenderingContext2D) {
  // ── Outer walls with 3D thickness ──
  // Top wall
  draw3DWallH(ctx, 12, 12, W - 24);
  // Left wall
  draw3DWallV(ctx, 12, 12, OFFICE_H - 18);
  // Right wall
  ctx.fillStyle = "#1A2030";
  ctx.fillRect(W - 12 - WALL_HEIGHT, 12, WALL_HEIGHT, OFFICE_H - 18);
  ctx.fillStyle = "#2E3A4E";
  ctx.fillRect(W - 14, 12, 3, OFFICE_H - 18);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(W - 14, 12, 1, OFFICE_H - 18);

  // Outer border
  ctx.strokeStyle = C.wallBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, W - 20, OFFICE_H - 14);

  // ── Main divider (left rooms | right area) ──
  draw3DWallV(ctx, 306, 12, OFFICE_H - 17);

  // ── Conference / Boss divider ──
  draw3DWallH(ctx, 12, 226, 298);
  // Door gap
  ctx.fillStyle = C.floorA; ctx.fillRect(248, 224, 54, WALL_HEIGHT + 6);

  // ── Boss / Kitchen divider ──
  draw3DWallH(ctx, 12, 414, 298);
  ctx.fillStyle = C.floorA; ctx.fillRect(248, 412, 54, WALL_HEIGHT + 6);

  // ── Cubicles / Lounge divider ──
  draw3DWallH(ctx, 314, 328, W - 326);
  ctx.fillStyle = C.floorA; ctx.fillRect(488, 326, 64, WALL_HEIGHT + 6);

  // ── VertexAura sign (with 3D shadow) ──
  const signX = W - 190, signY = 30;
  // Sign shadow
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  roundRect(ctx, signX + 3, signY + 3, 160, 24, 4);
  // Sign body
  ctx.fillStyle = C.signBg;
  roundRect(ctx, signX, signY, 160, 24, 4);
  ctx.strokeStyle = "#3B82F6" + "40";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(signX, signY, 160, 24, 4); ctx.stroke();
  // Sign highlight
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(signX + 4, signY + 2, 152, 2);
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "#3B82F6";
  ctx.fillText("VERTEXAURA", signX + 80, signY + 16);
}

// ── Room labels ──
function drawLabels(ctx: CanvasRenderingContext2D) {
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  for (const r of Object.values(ROOMS)) {
    const tx = r.x + r.w / 2;
    const tw = ctx.measureText(r.label).width + 14;
    ctx.fillStyle = C.labelBg;
    roundRect(ctx, tx - tw / 2, r.y + 4, tw, 15, 3);
    ctx.fillStyle = "#3D4A5C";
    ctx.fillText(r.label, tx, r.y + 15);
  }
}

// ── Conference room ──
function drawConference(ctx: CanvasRenderingContext2D) {
  const r = ROOMS.conference;
  // Table
  ctx.fillStyle = C.table;
  roundRect(ctx, r.x + 55, r.y + 65, 170, 85, 6);
  ctx.strokeStyle = C.tableBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 55, r.y + 65, 170, 85, 6); ctx.stroke();
  // Table shine
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(r.x + 65, r.y + 70, 100, 4);

  // Chairs (rounded)
  ctx.fillStyle = C.chair;
  const cpos = [
    [r.x + 80, r.y + 48], [r.x + 140, r.y + 48], [r.x + 195, r.y + 48],
    [r.x + 80, r.y + 158], [r.x + 140, r.y + 158], [r.x + 195, r.y + 158],
    [r.x + 38, r.y + 92], [r.x + 232, r.y + 92],
  ];
  for (const [cx, cy] of cpos) { roundRect(ctx, cx, cy, 16, 16, 4); }

  // Whiteboard on top wall
  ctx.fillStyle = "#F0F0F0";
  ctx.fillRect(r.x + 80, r.y + 22, 120, 30);
  ctx.strokeStyle = "#888"; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 80, r.y + 22, 120, 30);
  // Whiteboard content (scribbles)
  ctx.strokeStyle = "#3B82F6"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(r.x + 90, r.y + 32); ctx.lineTo(r.x + 140, r.y + 35); ctx.stroke();
  ctx.strokeStyle = "#EF4444";
  ctx.beginPath(); ctx.moveTo(r.x + 90, r.y + 40); ctx.lineTo(r.x + 130, r.y + 42); ctx.stroke();
  ctx.strokeStyle = "#22C55E";
  ctx.beginPath(); ctx.moveTo(r.x + 150, r.y + 32); ctx.lineTo(r.x + 185, r.y + 34); ctx.stroke();
}

// ── Boss office ──
function drawBoss(ctx: CanvasRenderingContext2D) {
  const r = ROOMS.boss;
  // Desk
  ctx.fillStyle = C.deskTop;
  roundRect(ctx, r.x + 35, r.y + 50, 130, 55, 4);
  ctx.strokeStyle = C.deskBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 35, r.y + 50, 130, 55, 4); ctx.stroke();

  // Monitor
  ctx.fillStyle = C.monitorOn;
  ctx.fillRect(r.x + 78, r.y + 55, 34, 22);
  ctx.strokeStyle = C.monitorFrame; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 78, r.y + 55, 34, 22);
  // Screen content
  ctx.fillStyle = "#0A1525";
  ctx.fillRect(r.x + 80, r.y + 57, 30, 18);
  // Lines on screen
  ctx.fillStyle = "#1A3050";
  for (let i = 0; i < 4; i++) { ctx.fillRect(r.x + 83, r.y + 60 + i * 4, 18 - i * 2, 1); }
  // Stand
  ctx.fillStyle = C.monitorFrame;
  ctx.fillRect(r.x + 91, r.y + 77, 8, 4);

  // Exec chair
  ctx.fillStyle = "#1A1A28";
  roundRect(ctx, r.x + 83, r.y + 115, 24, 22, 5);
  ctx.fillStyle = "#222232";
  roundRect(ctx, r.x + 86, r.y + 112, 18, 8, 3);

  // Bookshelf
  ctx.fillStyle = C.shelf;
  ctx.fillRect(r.x + 200, r.y + 28, 65, 125);
  ctx.strokeStyle = C.deskBorder; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 200, r.y + 28, 65, 125);
  for (let s = 0; s < 4; s++) {
    const sy = r.y + 28 + s * 31;
    ctx.fillStyle = C.deskBorder;
    ctx.fillRect(r.x + 200, sy + 30, 65, 2);
    // Books
    const bookColors = ["#3A1828", "#1A2840", "#2A3828", "#382818", "#281838"];
    for (let b = 0; b < 5; b++) {
      ctx.fillStyle = bookColors[b];
      ctx.fillRect(r.x + 205 + b * 11, sy + 8, 8, 22);
    }
  }

  // Name plate
  ctx.fillStyle = "#C4956A";
  roundRect(ctx, r.x + 68, r.y + 43, 55, 6, 2);
  ctx.font = "6px monospace"; ctx.fillStyle = "#1A1A1A"; ctx.textAlign = "center";
  ctx.fillText("SANTI", r.x + 95, r.y + 48);

  // Small plant on desk
  ctx.fillStyle = C.plantPot;
  ctx.fillRect(r.x + 140, r.y + 60, 10, 12);
  ctx.fillStyle = C.plantGreen;
  ellipse(ctx, r.x + 145, r.y + 56, 8, 6);
}

// ── Kitchen ──
function drawKitchen(ctx: CanvasRenderingContext2D) {
  const r = ROOMS.kitchen;
  // Counter along top wall
  ctx.fillStyle = C.counter;
  ctx.fillRect(r.x + 20, r.y + 30, 240, 25);
  ctx.fillStyle = C.counterTop;
  ctx.fillRect(r.x + 20, r.y + 28, 240, 6);

  // Fridge
  ctx.fillStyle = C.fridge;
  roundRect(ctx, r.x + 25, r.y + 58, 45, 75, 3);
  ctx.strokeStyle = C.deskBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 25, r.y + 58, 45, 75, 3); ctx.stroke();
  // Fridge line + handle
  ctx.strokeStyle = C.fridgeDark;
  ctx.beginPath(); ctx.moveTo(r.x + 25, r.y + 95); ctx.lineTo(r.x + 70, r.y + 95); ctx.stroke();
  ctx.fillStyle = "#555";
  ctx.fillRect(r.x + 65, r.y + 72, 2, 15);
  ctx.fillRect(r.x + 65, r.y + 102, 2, 15);

  // Microwave on counter
  ctx.fillStyle = "#3A3A42";
  roundRect(ctx, r.x + 100, r.y + 32, 50, 24, 2);
  ctx.fillStyle = "#0A0A12";
  ctx.fillRect(r.x + 104, r.y + 35, 32, 17);
  // Microwave buttons
  ctx.fillStyle = "#555";
  ctx.fillRect(r.x + 140, r.y + 36, 6, 6);
  ctx.fillStyle = "#22C55E";
  ctx.fillRect(r.x + 140, r.y + 44, 6, 3);

  // Coffee machine
  ctx.fillStyle = "#3A2820";
  roundRect(ctx, r.x + 190, r.y + 30, 35, 28, 3);
  ctx.fillStyle = "#5A3E2A";
  ctx.fillRect(r.x + 197, r.y + 26, 20, 8);
  // Steam (animated via frame count - static here, animated in draw)
  ctx.fillStyle = "rgba(180,180,180,0.15)";
  ellipse(ctx, r.x + 207, r.y + 22, 5, 3);

  // Table with chairs
  ctx.fillStyle = C.table;
  roundRect(ctx, r.x + 85, r.y + 150, 90, 50, 5);
  ctx.strokeStyle = C.tableBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 85, r.y + 150, 90, 50, 5); ctx.stroke();
  // Chairs
  ctx.fillStyle = C.chair;
  roundRect(ctx, r.x + 100, r.y + 140, 14, 14, 4);
  roundRect(ctx, r.x + 148, r.y + 140, 14, 14, 4);
  roundRect(ctx, r.x + 100, r.y + 205, 14, 14, 4);
  roundRect(ctx, r.x + 148, r.y + 205, 14, 14, 4);

  // Water cooler
  ctx.fillStyle = "#2A3545";
  ctx.fillRect(r.x + 235, r.y + 70, 20, 50);
  ctx.fillStyle = "#4488CC";
  roundRect(ctx, r.x + 232, r.y + 60, 26, 18, 4);
}

// ── Alfred's premium corner office ──
function drawAlfredDesk(ctx: CanvasRenderingContext2D, states: Record<string, AgentState>, frame: number) {
  const d = DESKS.alfred;
  const pal = PAL.alfred;
  const occ = states.alfred?.status === "working";

  // Larger partition (corner office feel) — wider than normal cubicles
  ctx.fillStyle = C.wallInner;
  ctx.fillRect(d.x - 55, d.y - 20, 4, 100);  // left
  ctx.fillRect(d.x + 75, d.y - 20, 4, 100);  // right
  ctx.fillRect(d.x - 55, d.y - 20, 134, 4);   // back
  ctx.strokeStyle = C.wallBorder; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(d.x - 55, d.y + 80); ctx.lineTo(d.x - 55, d.y - 20);
  ctx.lineTo(d.x + 79, d.y - 20); ctx.lineTo(d.x + 79, d.y + 80);
  ctx.stroke();

  // Premium accent stripe on partition top
  ctx.fillStyle = pal.body + "40";
  ctx.fillRect(d.x - 55, d.y - 20, 134, 2);

  // L-shaped desk (wider, deeper)
  ctx.fillStyle = "#283648"; // darker premium wood
  roundRect(ctx, d.x - 45, d.y - 5, 110, 50, 4);
  roundRect(ctx, d.x + 40, d.y - 5, 30, 70, 4);
  ctx.strokeStyle = "#1A2535"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(d.x - 45, d.y - 5, 110, 50, 4); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(d.x + 40, d.y - 5, 30, 70, 4); ctx.stroke();
  // Desk edge highlight
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  ctx.fillRect(d.x - 43, d.y - 4, 106, 2);

  // === DUAL MONITORS ===
  const m1x = d.x - 30, m2x = d.x + 8, my = d.y;
  const monW = 32, monH = 22;
  for (const mx of [m1x, m2x]) {
    ctx.fillStyle = occ ? C.monitorOn : C.monitorOff;
    ctx.fillRect(mx, my, monW, monH);
    ctx.strokeStyle = "#2A3448"; ctx.lineWidth = 1.5;
    ctx.strokeRect(mx, my, monW, monH);
    // Thin bezel
    ctx.strokeStyle = "#1A1A28"; ctx.lineWidth = 0.5;
    ctx.strokeRect(mx + 1, my + 1, monW - 2, monH - 2);

    if (occ) {
      ctx.fillStyle = C.monitorScreen;
      ctx.fillRect(mx + 2, my + 2, monW - 4, monH - 4);
    }
    // Stand (slim modern arm)
    ctx.fillStyle = "#2A3448";
    ctx.fillRect(mx + 13, my + monH, 6, 5);
    ctx.fillRect(mx + 10, my + monH + 4, 12, 2);
  }

  // Left screen: code/terminal
  if (occ) {
    const lineColors = ["#22C55E", "#3B82F6", "#888", "#22C55E", "#6366F1", "#888"];
    for (let ln = 0; ln < 6; ln++) {
      ctx.fillStyle = lineColors[ln] + "70";
      const lw = 8 + ((frame + ln * 5) % 14);
      ctx.fillRect(m1x + 4, my + 3 + ln * 3, Math.min(lw, monW - 6), 1);
    }
    // Right screen: dashboard/graphs
    // Bar chart
    const bars = [8, 14, 10, 16, 12];
    for (let b = 0; b < 5; b++) {
      const bh = bars[b] + ((frame + b * 3) % 4);
      ctx.fillStyle = b % 2 === 0 ? "#3B82F680" : "#6366F180";
      ctx.fillRect(m2x + 4 + b * 5, my + monH - 4 - bh, 4, bh);
    }
    // Monitor glow
    ctx.fillStyle = pal.glow;
    ellipse(ctx, d.x + 5, my + monH / 2, 50, monH + 10);
  }

  // Premium ergonomic chair (bigger, with armrests)
  ctx.fillStyle = occ ? "#1A2545" : "#1A1A2A";
  roundRect(ctx, d.x - 5, d.y + 56, 24, 22, 7);
  ctx.fillStyle = occ ? "#1E2A4A" : "#1E1E2E";
  roundRect(ctx, d.x - 2, d.y + 52, 18, 8, 4); // headrest
  // Armrests
  ctx.fillStyle = "#252535";
  ctx.fillRect(d.x - 8, d.y + 62, 4, 10);
  ctx.fillRect(d.x + 18, d.y + 62, 4, 10);

  // Mechanical keyboard (wider, RGB hint)
  ctx.fillStyle = "#1A1A28";
  roundRect(ctx, d.x - 18, d.y + 30, 40, 10, 2);
  if (occ) {
    // RGB underglow
    ctx.fillStyle = pal.body + "20";
    ctx.fillRect(d.x - 17, d.y + 39, 38, 2);
  }
  // Mouse pad + mouse
  ctx.fillStyle = "#151520";
  roundRect(ctx, d.x + 25, d.y + 28, 20, 16, 2);
  ctx.fillStyle = "#252535";
  roundRect(ctx, d.x + 30, d.y + 32, 10, 8, 3);

  // Personal items on side desk
  // Coffee mug (premium, with steam)
  ctx.fillStyle = "#3B82F6";
  roundRect(ctx, d.x + 48, d.y + 8, 10, 12, 2);
  ctx.fillStyle = "#2563EB";
  ctx.fillRect(d.x + 58, d.y + 11, 3, 5);
  if (frame % 40 < 20) {
    ctx.fillStyle = "rgba(200,200,220,0.12)";
    ellipse(ctx, d.x + 53, d.y + 4, 4, 3);
  }

  // Small desk lamp
  ctx.fillStyle = "#333340";
  ctx.fillRect(d.x + 48, d.y + 24, 3, 14); // pole
  ctx.fillStyle = occ ? "#F59E0B40" : "#333340";
  roundRect(ctx, d.x + 44, d.y + 22, 12, 4, 2); // shade
  if (occ) {
    ctx.fillStyle = "rgba(245,158,11,0.08)";
    ellipse(ctx, d.x + 50, d.y + 34, 14, 10); // light cone
  }

  // Award/trophy on shelf
  ctx.fillStyle = "#C4956A";
  ctx.fillRect(d.x - 48, d.y - 10, 8, 3);
  ctx.fillStyle = "#D4A57A";
  ctx.fillRect(d.x - 46, d.y - 16, 4, 6);
  ctx.fillStyle = "#F5C842";
  ellipse(ctx, d.x - 44, d.y - 18, 3, 3);

  // Photo frame on wall
  ctx.strokeStyle = "#3A3A4A"; ctx.lineWidth = 1;
  ctx.strokeRect(d.x - 35, d.y - 15, 16, 12);
  ctx.fillStyle = "#1A2030";
  ctx.fillRect(d.x - 34, d.y - 14, 14, 10);

  // Blue LED accent strip along desk edge
  const ledGlow = occ ? 0.6 : 0.25;
  ctx.fillStyle = `rgba(59,130,246,${ledGlow})`;
  ctx.fillRect(d.x - 45, d.y + 44, 110, 2);
  // LED glow effect underneath
  ctx.fillStyle = `rgba(59,130,246,${ledGlow * 0.3})`;
  ellipse(ctx, d.x + 10, d.y + 48, 55, 6);
  // Side LED strip on L-desk
  ctx.fillStyle = `rgba(59,130,246,${ledGlow * 0.8})`;
  ctx.fillRect(d.x + 69, d.y - 5, 2, 70);
}

// ── Regular cubicles (Roberto, Andrés) ──
function drawCubicles(ctx: CanvasRenderingContext2D, states: Record<string, AgentState>, frame: number) {
  // Draw Alfred's premium desk first
  drawAlfredDesk(ctx, states, frame);

  // Then Roberto, Andrés, Marina, Arturo, Alex standard cubicles
  const ids = ["roberto", "andres", "marina", "arturo", "alex"] as const;

  for (const id of ids) {
    const d = DESKS[id];
    const pal = PAL[id];
    const occ = states[id]?.status === "working";

    // Partition walls (U shape)
    ctx.fillStyle = C.wallInner;
    ctx.fillRect(d.x - 42, d.y - 15, 4, 85);  // left
    ctx.fillRect(d.x + 58, d.y - 15, 4, 85);  // right
    ctx.fillRect(d.x - 42, d.y - 15, 104, 4);  // back
    ctx.strokeStyle = C.wallBorder; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(d.x - 42, d.y + 70); ctx.lineTo(d.x - 42, d.y - 15);
    ctx.lineTo(d.x + 62, d.y - 15); ctx.lineTo(d.x + 62, d.y + 70);
    ctx.stroke();

    // Desk
    ctx.fillStyle = C.deskTop;
    roundRect(ctx, d.x - 32, d.y, 84, 42, 3);
    ctx.strokeStyle = C.deskBorder; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(d.x - 32, d.y, 84, 42, 3); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(d.x - 30, d.y + 1, 80, 2);

    // Single monitor
    const monW = 34, monH = 22;
    const mx = d.x - 2, my = d.y + 5;
    ctx.fillStyle = occ ? C.monitorOn : C.monitorOff;
    ctx.fillRect(mx, my, monW, monH);
    ctx.strokeStyle = C.monitorFrame; ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, monW, monH);

    if (occ) {
      ctx.fillStyle = C.monitorScreen;
      ctx.fillRect(mx + 2, my + 2, monW - 4, monH - 4);
      const lineColors = [pal.body, "#22C55E", "#888", pal.body, "#888"];
      for (let ln = 0; ln < 5; ln++) {
        ctx.fillStyle = lineColors[ln] + "60";
        const lw = 10 + ((frame + ln * 7) % 12);
        ctx.fillRect(mx + 4, my + 4 + ln * 3, Math.min(lw, monW - 8), 1);
      }
      ctx.fillStyle = pal.glow;
      ellipse(ctx, mx + monW / 2, my + monH / 2, monW, monH + 8);
    }

    // Stand
    ctx.fillStyle = C.monitorFrame;
    roundRect(ctx, mx + 12, my + monH, 10, 5, 1);
    ctx.fillRect(mx + 8, my + monH + 4, 18, 2);

    // Chair
    ctx.fillStyle = occ ? pal.body + "30" : C.chair;
    roundRect(ctx, d.x + 2, d.y + 52, 16, 16, 5);

    // Keyboard
    ctx.fillStyle = "#2A2A35";
    ctx.fillRect(d.x - 2, d.y + 32, 24, 6);

    // Personal items
    if (id === "roberto") {
      ctx.fillStyle = "#F0E8D0";
      ctx.fillRect(d.x + 38, d.y + 10, 12, 16);
      ctx.fillStyle = "#8B5CF6";
      ctx.fillRect(d.x + 40, d.y + 14, 8, 1);
      ctx.fillRect(d.x + 40, d.y + 17, 6, 1);
    } else if (id === "andres") {
      // Andrés: small cactus
      ctx.fillStyle = C.plantPot;
      ctx.fillRect(d.x + 40, d.y + 14, 8, 8);
      ctx.fillStyle = C.plantGreen;
      ctx.fillRect(d.x + 42, d.y + 6, 4, 10);
      ctx.fillRect(d.x + 40, d.y + 10, 2, 4);
      ctx.fillRect(d.x + 46, d.y + 8, 2, 4);
    } else if (id === "marina") {
      // Marina: phone tripod + color swatches
      // Small phone on tripod
      ctx.fillStyle = "#333340";
      ctx.fillRect(d.x + 40, d.y + 8, 8, 14); // phone
      ctx.fillStyle = "#EC4899";
      ctx.fillRect(d.x + 41, d.y + 9, 6, 10); // screen glow
      ctx.fillStyle = "#555";
      ctx.fillRect(d.x + 42, d.y + 22, 1, 8); // tripod leg
      ctx.fillRect(d.x + 44, d.y + 22, 1, 8); // tripod leg
      ctx.fillRect(d.x + 46, d.y + 22, 1, 8); // tripod leg
      // Color palette swatches (sticky notes)
      ctx.fillStyle = "#EC4899";
      ctx.fillRect(d.x - 34, d.y + 4, 6, 6);
      ctx.fillStyle = "#8B5CF6";
      ctx.fillRect(d.x - 27, d.y + 4, 6, 6);
      ctx.fillStyle = "#3B82F6";
      ctx.fillRect(d.x - 34, d.y + 11, 6, 6);
      ctx.fillStyle = "#22C55E";
      ctx.fillRect(d.x - 27, d.y + 11, 6, 6);
    } else if (id === "arturo") {
      // Arturo: bar chart printout + gold pen
      ctx.fillStyle = "#F0E8D0";
      ctx.fillRect(d.x + 36, d.y + 8, 14, 18);
      // Mini bar chart on paper
      const barH = [6, 10, 8, 12, 14];
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = b % 2 === 0 ? "#EAB308" : "#CA8A04";
        ctx.fillRect(d.x + 38 + b * 2, d.y + 26 - barH[b], 1.5, barH[b]);
      }
      // Gold pen
      ctx.fillStyle = "#EAB308";
      ctx.fillRect(d.x - 30, d.y + 12, 12, 2);
      ctx.fillStyle = "#CA8A04";
      ctx.fillRect(d.x - 32, d.y + 11, 3, 4);
    } else if (id === "alex") {
      // Alex: dollar sign sticky + red notebook
      ctx.fillStyle = "#EF4444";
      ctx.fillRect(d.x + 38, d.y + 10, 12, 16);
      ctx.fillStyle = "#DC2626";
      ctx.fillRect(d.x + 38, d.y + 10, 12, 2);
      // $ sign on notebook
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#F87171";
      ctx.fillText("$", d.x + 44, d.y + 22);
      // Post-it with arrow up
      ctx.fillStyle = "#F87171";
      ctx.fillRect(d.x - 32, d.y + 6, 8, 8);
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(d.x - 29, d.y + 8, 2, 4);
      ctx.fillRect(d.x - 30, d.y + 9, 4, 1);
    }

    // Name label
    ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = pal.body;
    ctx.fillText(pal.name, d.x + 10, d.y + 84);
  }
}

// ── Lounge ──
function drawLounge(ctx: CanvasRenderingContext2D) {
  const r = ROOMS.lounge;

  // L-shaped sofa
  ctx.fillStyle = C.sofa;
  roundRect(ctx, r.x + 50, r.y + 70, 200, 55, 6);
  roundRect(ctx, r.x + 50, r.y + 70, 55, 145, 6);
  // Armrests
  ctx.fillStyle = C.sofaArm;
  roundRect(ctx, r.x + 50, r.y + 70, 200, 10, 4);
  roundRect(ctx, r.x + 50, r.y + 70, 10, 145, 4);
  // Cushions
  ctx.fillStyle = C.sofaCushion;
  roundRect(ctx, r.x + 65, r.y + 82, 40, 36, 4);
  roundRect(ctx, r.x + 112, r.y + 82, 40, 36, 4);
  roundRect(ctx, r.x + 160, r.y + 82, 40, 36, 4);
  roundRect(ctx, r.x + 208, r.y + 82, 35, 36, 4);

  // Coffee table
  ctx.fillStyle = C.table;
  roundRect(ctx, r.x + 130, r.y + 145, 90, 45, 5);
  ctx.strokeStyle = C.tableBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 130, r.y + 145, 90, 45, 5); ctx.stroke();
  // Items on table
  ctx.fillStyle = "#2A1828"; // magazine
  ctx.fillRect(r.x + 140, r.y + 155, 20, 14);
  ctx.fillStyle = "#4A3828"; // laptop
  roundRect(ctx, r.x + 175, r.y + 150, 30, 20, 2);

  // Large plant
  ctx.fillStyle = C.plantPot;
  roundRect(ctx, r.x + 340, r.y + 55, 28, 35, 4);
  ctx.fillStyle = C.plantGreen;
  ellipse(ctx, r.x + 354, r.y + 42, 14, 12);
  ellipse(ctx, r.x + 344, r.y + 36, 12, 14);
  ellipse(ctx, r.x + 358, r.y + 30, 10, 12);
  ctx.fillStyle = C.plantLight;
  ellipse(ctx, r.x + 350, r.y + 28, 8, 8);
  ellipse(ctx, r.x + 360, r.y + 38, 6, 6);

  // Second plant
  ctx.fillStyle = C.plantPot;
  roundRect(ctx, r.x + 580, r.y + 250, 20, 25, 3);
  ctx.fillStyle = C.plantGreen;
  ellipse(ctx, r.x + 590, r.y + 240, 10, 10);
  ctx.fillStyle = C.plantLight;
  ellipse(ctx, r.x + 586, r.y + 236, 6, 7);

  // Vending machine
  ctx.fillStyle = "#222232";
  roundRect(ctx, r.x + 610, r.y + 35, 55, 90, 4);
  ctx.strokeStyle = C.wallBorder; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(r.x + 610, r.y + 35, 55, 90, 4); ctx.stroke();
  // Display
  ctx.fillStyle = "#0A1020";
  ctx.fillRect(r.x + 617, r.y + 42, 40, 45);
  // Shelves inside display
  ctx.fillStyle = "#1A2030";
  for (let sv = 0; sv < 3; sv++) {
    ctx.fillRect(r.x + 617, r.y + 55 + sv * 11, 40, 1);
    // Drinks
    const dColors = ["#C0392B", "#2980B9", "#27AE60", "#F39C12"];
    for (let dv = 0; dv < 4; dv++) {
      ctx.fillStyle = dColors[dv];
      ctx.fillRect(r.x + 620 + dv * 9, r.y + 44 + sv * 11, 5, 9);
    }
  }
  // Slot + buttons
  ctx.fillStyle = "#333";
  ctx.fillRect(r.x + 630, r.y + 92, 20, 6);
  ctx.fillStyle = "#22C55E";
  roundRect(ctx, r.x + 622, r.y + 105, 10, 10, 2);
  ctx.fillStyle = "#EF4444";
  roundRect(ctx, r.x + 640, r.y + 105, 10, 10, 2);

  // Bean bags
  ctx.fillStyle = "#1A3050";
  ellipse(ctx, r.x + 470, r.y + 230, 32, 22);
  ctx.fillStyle = "#301A30";
  ellipse(ctx, r.x + 540, r.y + 250, 30, 20);

  // Wall art (simple frames)
  ctx.strokeStyle = C.wallBorder; ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 420, r.y + 10, 40, 30);
  ctx.fillStyle = "#1A2540";
  ctx.fillRect(r.x + 422, r.y + 12, 36, 26);
  ctx.strokeRect(r.x + 480, r.y + 10, 40, 30);
  ctx.fillStyle = "#2A1830";
  ctx.fillRect(r.x + 482, r.y + 12, 36, 26);
}

// ── Clock ──
function drawClock(ctx: CanvasRenderingContext2D, _frame: number) {
  const cx = 160, cy = 42, r = 14;
  // Clock body
  ctx.fillStyle = "#F8F8F0";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#333"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  // Real time
  const now = new Date();
  const h = now.getHours(), m = now.getMinutes();
  // Hour hand
  const ha = ((h % 12) + m / 60) * (Math.PI * 2 / 12) - Math.PI / 2;
  ctx.strokeStyle = "#1A1A1A"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ha) * 7, cy + Math.sin(ha) * 7); ctx.stroke();
  // Minute hand
  const ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(ma) * 10, cy + Math.sin(ma) * 10); ctx.stroke();
  // Center dot
  ctx.fillStyle = "#C0392B";
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();

  // Tick marks
  ctx.fillStyle = "#555";
  for (let t = 0; t < 12; t++) {
    const ta = t * Math.PI * 2 / 12 - Math.PI / 2;
    ctx.fillRect(cx + Math.cos(ta) * 11 - 0.5, cy + Math.sin(ta) * 11 - 0.5, 1, 1);
  }
}

// ── Thought bubble (when typing) ──
function drawThoughtBubble(ctx: CanvasRenderingContext2D, x: number, y: number, pal: Pal, frame: number) {
  const bubY = y - 50;
  // Dots leading to bubble
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath(); ctx.arc(x + 4, bubY + 22, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 8, bubY + 14, 3, 0, Math.PI * 2); ctx.fill();
  // Bubble
  ctx.fillStyle = "rgba(20,20,30,0.85)";
  roundRect(ctx, x - 5, bubY - 8, 40, 18, 6);
  ctx.strokeStyle = pal.body + "60"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x - 5, bubY - 8, 40, 18, 6); ctx.stroke();
  // Typing dots animation
  for (let i = 0; i < 3; i++) {
    const dotPhase = (frame + i * 6) % 24;
    const dotY = dotPhase < 12 ? bubY - 1 : bubY + 1;
    ctx.fillStyle = pal.body;
    ctx.beginPath(); ctx.arc(x + 5 + i * 10, dotY, 2.5, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Agent sprite ──
function drawAgent(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  pal: Pal, walk: number, typing: boolean, typeFr: number,
  isErr: boolean, frame: number, breathOff: number,
  isFemale?: boolean,
) {
  const p = PX;
  const breath = Math.sin((frame + breathOff) * 0.08) * 0.5;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ellipse(ctx, x, y + 22 * p, 7 * p, 2.5 * p);

  // ── Hair ──
  ctx.fillStyle = pal.hair;
  roundRect(ctx, x - 4 * p, y - 20 * p + breath, 8 * p, 4 * p, 2);
  if (isFemale) {
    // Long hair sides (shoulder length)
    ctx.fillRect(x - 4 * p, y - 18 * p + breath, p, 14 * p);
    ctx.fillRect(x + 3 * p, y - 18 * p + breath, p, 14 * p);
    // Outer strands flowing over shoulders
    ctx.fillRect(x - 5 * p, y - 10 * p + breath, p, 8 * p);
    ctx.fillRect(x + 4 * p, y - 10 * p + breath, p, 8 * p);
    // Hair ends (slightly tapered)
    ctx.fillStyle = pal.bodyDark;
    ctx.fillRect(x - 5 * p, y - 3 * p + breath, p, 2 * p);
    ctx.fillRect(x + 4 * p, y - 3 * p + breath, p, 2 * p);
  } else {
    // Short hair sides (male)
    ctx.fillRect(x - 4 * p, y - 18 * p + breath, p, 3 * p);
    ctx.fillRect(x + 3 * p, y - 18 * p + breath, p, 3 * p);
  }

  // ── Face ──
  ctx.fillStyle = C.skin;
  ctx.fillRect(x - 3 * p, y - 16 * p + breath, 6 * p, 6 * p);
  // Face shadow
  ctx.fillStyle = C.skinShadow;
  ctx.fillRect(x - 3 * p, y - 11 * p + breath, 6 * p, p);

  // Eyes
  ctx.fillStyle = C.eyeColor;
  ctx.fillRect(x - 2 * p, y - 14 * p + breath, p, p);
  ctx.fillRect(x + 1 * p, y - 14 * p + breath, p, p);
  // Eye highlights
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(x - 2 * p, y - 14 * p + breath, 0.5, 0.5);
  ctx.fillRect(x + 1 * p, y - 14 * p + breath, 0.5, 0.5);

  // Mouth
  ctx.fillStyle = C.skinShadow;
  ctx.fillRect(x - p * 0.5, y - 12 * p + breath, p, 0.5);

  // ── Neck ──
  ctx.fillStyle = C.skin;
  ctx.fillRect(x - p, y - 10 * p + breath, 2 * p, 2 * p);

  // ── Body (shirt) ──
  ctx.fillStyle = pal.body;
  ctx.fillRect(x - 4 * p, y - 8 * p + breath, 8 * p, 10 * p);
  // Shirt shading
  ctx.fillStyle = pal.bodyDark;
  ctx.fillRect(x - 4 * p, y - 8 * p + breath, p, 10 * p);
  ctx.fillRect(x + 3 * p, y - 8 * p + breath, p, 10 * p);
  // Collar
  ctx.fillStyle = pal.bodyDark;
  ctx.fillRect(x - 2 * p, y - 8 * p + breath, 4 * p, p);

  // ── Arms ──
  if (typing) {
    const aOff = typeFr % 2 === 0 ? 0 : p;
    ctx.fillStyle = pal.body;
    ctx.fillRect(x - 5 * p, y - 6 * p + breath - aOff, p, 7 * p);
    ctx.fillRect(x + 4 * p, y - 6 * p + breath + aOff, p, 7 * p);
    ctx.fillStyle = C.skin;
    roundRect(ctx, x - 5 * p, y + p + breath - aOff, p, p, 0.5);
    roundRect(ctx, x + 4 * p, y + p + breath + aOff, p, p, 0.5);
  } else {
    ctx.fillStyle = pal.body;
    ctx.fillRect(x - 5 * p, y - 6 * p + breath, p, 7 * p);
    ctx.fillRect(x + 4 * p, y - 6 * p + breath, p, 7 * p);
    ctx.fillStyle = C.skin;
    roundRect(ctx, x - 5 * p, y + p + breath, p, p, 0.5);
    roundRect(ctx, x + 4 * p, y + p + breath, p, p, 0.5);
  }

  // ── Belt ──
  ctx.fillStyle = "#1A1A25";
  ctx.fillRect(x - 4 * p, y + 2 * p + breath, 8 * p, p);

  // ── Legs ──
  ctx.fillStyle = C.pants;
  if (walk % 2 === 0) {
    ctx.fillRect(x - 2 * p, y + 3 * p, 2 * p, 8 * p);
    ctx.fillRect(x, y + 3 * p, 2 * p, 8 * p);
  } else {
    ctx.fillRect(x - 3 * p, y + 3 * p, 2 * p, 8 * p);
    ctx.fillRect(x + p, y + 3 * p, 2 * p, 8 * p);
  }

  // ── Shoes ──
  ctx.fillStyle = C.shoes;
  if (walk % 2 === 0) {
    roundRect(ctx, x - 2 * p, y + 11 * p, 2 * p, 2 * p, 1);
    roundRect(ctx, x, y + 11 * p, 2 * p, 2 * p, 1);
  } else {
    roundRect(ctx, x - 3 * p, y + 11 * p, 2 * p, 2 * p, 1);
    roundRect(ctx, x + p, y + 11 * p, 2 * p, 2 * p, 1);
  }

  // ── Working glow ──
  if (typing) {
    ctx.fillStyle = pal.glow;
    ellipse(ctx, x, y - 2 * p, 20 * p, 18 * p);
    drawThoughtBubble(ctx, x, y, pal, frame);
  }

  // ── Error "!" ──
  if (isErr && (frame % 30) < 15) {
    ctx.fillStyle = "#EF4444";
    ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
    ctx.fillText("!", x, y - 24 * p);
    // Red glow
    ctx.fillStyle = "rgba(239,68,68,0.15)";
    ellipse(ctx, x, y - 2 * p, 15 * p, 14 * p);
  }

  // ── Name label ──
  const labelY = y - 24 * p + (isErr ? -12 : 0);
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  // Text shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillText(pal.name, x + 1, labelY + 1);
  ctx.fillStyle = pal.body;
  ctx.fillText(pal.name, x, labelY);
}

// ── Ambient particles ──
const PARTICLES: { x: number; y: number; speed: number; size: number; alpha: number }[] = [];
for (let i = 0; i < 15; i++) {
  PARTICLES.push({
    x: Math.random() * W,
    y: Math.random() * OFFICE_H,
    speed: 0.1 + Math.random() * 0.2,
    size: 1 + Math.random() * 1.5,
    alpha: 0.03 + Math.random() * 0.05,
  });
}

function drawParticles(ctx: CanvasRenderingContext2D, frame: number) {
  for (const p of PARTICLES) {
    const py = (p.y + frame * p.speed) % OFFICE_H;
    ctx.fillStyle = `rgba(200,210,230,${p.alpha})`;
    ctx.beginPath(); ctx.arc(p.x, py, p.size, 0, Math.PI * 2); ctx.fill();
  }
}

// ── Status bar ──
function drawStatusBar(ctx: CanvasRenderingContext2D, agents: AllAgentsStatus, frame: number) {
  const y = OFFICE_H;
  // Background with gradient feel
  ctx.fillStyle = "#080C12";
  ctx.fillRect(0, y, W, BAR_H);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, y, W, 1);

  const entries = [
    { pal: PAL.alfred, status: agents.alfred?.status || "idle", desc: agents.alfred?.lastActivityDescription || "" },
    { pal: PAL.roberto, status: agents.roberto?.status || "idle", desc: agents.roberto?.lastActivityDescription || "" },
    { pal: PAL.andres, status: agents.andres?.status || "idle", desc: agents.andres?.lastActivityDescription || "" },
    { pal: PAL.marina, status: agents.marina?.status || "idle", desc: agents.marina?.lastActivityDescription || "" },
    { pal: PAL.arturo, status: agents.arturo?.status || "idle", desc: agents.arturo?.lastActivityDescription || "" },
    { pal: PAL.alex, status: agents.alex?.status || "idle", desc: agents.alex?.lastActivityDescription || "" },
    { pal: PAL.santi, status: "idle" as const, desc: "Supervisando" },
  ];

  const secW = W / entries.length;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const cx = secW * i + secW / 2;

    // Divider
    if (i > 0) {
      ctx.strokeStyle = "#1A2030"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(secW * i, y + 8); ctx.lineTo(secW * i, y + BAR_H - 8); ctx.stroke();
    }

    // Status dot with glow
    const dotColor = e.status === "working" ? "#22C55E" : e.status === "error" ? "#EF4444" : "#3B3B4B";
    if (e.status === "working") {
      const pulse = Math.sin(frame * 0.1) * 2 + 5;
      ctx.fillStyle = dotColor + "30";
      ctx.beginPath(); ctx.arc(cx - 60, y + BAR_H / 2, pulse, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = dotColor;
    ctx.beginPath(); ctx.arc(cx - 60, y + BAR_H / 2, 4, 0, Math.PI * 2); ctx.fill();

    // Name
    ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
    ctx.fillStyle = e.pal.body;
    ctx.fillText(e.pal.name, cx - 48, y + BAR_H / 2 - 2);

    // Status text
    const statusLabel = e.status === "working" ? "trabajando..." : e.status === "error" ? "error" : "descansando";
    ctx.font = "9px monospace";
    ctx.fillStyle = e.status === "working" ? "#4ADE80" : e.status === "error" ? "#F87171" : "#52525B";
    ctx.fillText(statusLabel, cx - 48, y + BAR_H / 2 + 12);
  }
}

// ── Main component ──
export default function OfficeCanvas({ agents }: { agents: AllAgentsStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<Record<string, AgentState>>({
    alfred: makeAgent(IDLE_POS.alfred),
    roberto: makeAgent(IDLE_POS.roberto),
    andres: makeAgent(IDLE_POS.andres),
    marina: makeAgent(IDLE_POS.marina),
    arturo: makeAgent(IDLE_POS.arturo),
    alex: makeAgent(IDLE_POS.alex),
    santi: makeAgent(IDLE_POS.santi),
  });
  const frameRef = useRef(0);
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  // ── Standup detection ──
  const standupRef = useRef({ active: false, agents: [] as string[] });

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch("/api/standup-status");
        if (res.ok) {
          const data = await res.json();
          const active = !!data.active;
          const involved = Array.isArray(data.agents) ? data.agents as string[] : [];
          standupRef.current = { active, agents: active ? [...involved, "santi"] : [] };
        }
      } catch { /* ignore */ }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const update = useCallback(() => {
    const st = stateRef.current;
    const ag = agentsRef.current;
    const standup = standupRef.current;

    for (const id of ["alfred", "roberto", "andres", "marina", "arturo", "alex", "santi"]) {
      const s = st[id];
      const isSanti = id === "santi";
      const ns = isSanti ? "idle" : (ag[id as keyof typeof ag]?.status || "idle");

      // ── Standup override: send involved agents to conference room ──
      const inStandup = standup.active && standup.agents.includes(id);
      if (inStandup && CONF_SEATS[id]) {
        s.status = "working"; // show as active during standup
        s.targetX = CONF_SEATS[id].x;
        s.targetY = CONF_SEATS[id].y;
      } else if (s.status !== ns) {
        s.status = ns;
        if (ns === "working" || ns === "error") {
          s.targetX = DESKS[id].x + 10;
          s.targetY = DESKS[id].y + 58;
          s.wanderPause = 0;
        } else {
          // When switching back to idle, go to home position first
          s.targetX = IDLE_POS[id].x;
          s.targetY = IDLE_POS[id].y;
          s.wanderTimer = Math.floor(90 + Math.random() * 120);
        }
      }

      const dx = s.targetX - s.x;
      const dy = s.targetY - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        const speed = isSanti ? 1.0 : 1.5; // Santi walks slower (boss stroll)
        s.x += (dx / dist) * speed;
        s.y += (dy / dist) * speed;
        if (frameRef.current % 8 === 0) s.walkFrame = (s.walkFrame + 1) % 2;
        s.wanderPause = 0;
      } else {
        s.x = s.targetX;
        s.y = s.targetY;
        s.walkFrame = 0;

        if ((s.status === "working" || s.status === "error") && frameRef.current % 10 === 0) {
          s.typingFrame = (s.typingFrame + 1) % 2;
        }

        // ── Idle wandering ──
        if (s.status === "idle") {
          if (s.wanderPause > 0) {
            // Pausing at current spot before moving
            s.wanderPause--;
            if (frameRef.current % 90 === 0) {
              s.idleAction = (s.idleAction + 1) % 3;
            }
          } else {
            s.wanderTimer--;
            if (s.wanderTimer <= 0) {
              // Pick new destination and pause briefly before walking there
              const points = isSanti ? SANTI_WANDER : WANDER_POINTS;
              const pt = points[Math.floor(Math.random() * points.length)];
              s.targetX = pt.x + (Math.random() - 0.5) * 20;
              s.targetY = pt.y + (Math.random() - 0.5) * 20;
              s.wanderPause = Math.floor(30 + Math.random() * 60); // pause 1-3s before walking
              s.wanderTimer = Math.floor(90 + Math.random() * 120); // 3-7s countdown after arriving
            }
          }
        }
      }
    }
  }, []);

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const f = frameRef.current;
    ctx.clearRect(0, 0, W, H);

    drawFloor(ctx);

    // ── Pseudo-3D: Room ambient lighting (ceiling light effect) ──
    for (const room of Object.values(ROOMS)) {
      const lightX = room.x + room.w / 2;
      const lightY = room.y + room.h * 0.35;
      const grad = ctx.createRadialGradient(lightX, lightY, 10, lightX, lightY, Math.max(room.w, room.h) * 0.7);
      grad.addColorStop(0, "rgba(200, 220, 255, 0.04)");
      grad.addColorStop(0.5, "rgba(150, 180, 220, 0.015)");
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(room.x, room.y, room.w, room.h);
    }

    drawWalls(ctx);

    // ── Pseudo-3D: Wall top highlight (3D edge) ──
    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(12, 10, W - 24, 2); // top wall
    ctx.fillRect(310, 10, 2, 2); // divider top
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(12, 228, 298, 2); // conf/boss divider
    ctx.fillRect(12, 416, 298, 2); // boss/kitchen divider
    ctx.fillRect(310, 330, W - 322, 2); // cubicles/lounge divider

    drawConference(ctx);
    drawBoss(ctx);
    drawKitchen(ctx);
    drawCubicles(ctx, stateRef.current, f);
    drawLounge(ctx);
    drawLabels(ctx);
    drawClock(ctx, f);
    drawParticles(ctx, f);

    // Draw agents (sorted by Y for depth)
    const ids = ["alfred", "roberto", "andres", "marina", "arturo", "alex", "santi"];
    const sorted = [...ids].sort((a, b) => stateRef.current[a].y - stateRef.current[b].y);
    for (const id of sorted) {
      const s = stateRef.current[id];
      const atDesk = Math.abs(s.x - s.targetX) < 3 && Math.abs(s.y - s.targetY) < 3;
      const isTyping = atDesk && (s.status === "working" || s.status === "error");
      drawAgent(ctx, Math.round(s.x), Math.round(s.y), PAL[id], s.walkFrame, isTyping, s.typingFrame, s.status === "error", f, s.breathOffset, id === "marina");
    }

    // ── Standup indicator ──
    if (standupRef.current.active) {
      const pulse = Math.sin(f * 0.06) * 0.3 + 0.7;
      // Glow around conference room
      const cr = ROOMS.conference;
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.3 * pulse})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cr.x + 2, cr.y + 2, cr.w - 4, cr.h - 4, 4);
      ctx.stroke();

      // Banner
      const bannerW = 140, bannerH = 18;
      const bx = cr.x + cr.w / 2 - bannerW / 2;
      const by = cr.y - 4;
      ctx.fillStyle = `rgba(59, 130, 246, ${0.85 * pulse})`;
      ctx.beginPath(); ctx.roundRect(bx, by, bannerW, bannerH, 3); ctx.fill();
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText("STANDUP EN CURSO", cr.x + cr.w / 2, by + 13);
    }

    // ── Pseudo-3D: Vignette (dark edges) ──
    const vigGrad = ctx.createRadialGradient(W / 2, OFFICE_H / 2, Math.min(W, OFFICE_H) * 0.35, W / 2, OFFICE_H / 2, Math.max(W, OFFICE_H) * 0.7);
    vigGrad.addColorStop(0, "transparent");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.15)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, W, OFFICE_H);

    drawStatusBar(ctx, agentsRef.current, f);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animId: number;
    let last = 0;
    const interval = 1000 / 30;

    const loop = (t: number) => {
      if (t - last >= interval) {
        last = t - ((t - last) % interval);
        frameRef.current++;
        update();
        draw(ctx);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [draw, update]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / W, ch / H, 1);
      canvas.style.width = `${W * scale}px`;
      canvas.style.height = `${H * scale}px`;
    };

    const obs = new ResizeObserver(resize);
    obs.observe(container);
    resize();
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full flex items-center justify-center" style={{ background: "#060810" }}>
      <canvas ref={canvasRef} width={W} height={H} style={{ imageRendering: "pixelated" }} />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, RefreshCw, ZoomIn, ZoomOut, Maximize2, X, FileText, Link2, Tag, User, Calendar } from "lucide-react";

// ── Types ──

interface VaultNode {
  id: string;
  label: string;
  category: string;
  color: string;
  priority: string;
  confidence: number;
  mentions: number;
  memoryType: string;
  author: string;
  date: string;
  last_updated: string;
  tags: string[];
  word_count: number;
  links: string[];
}

interface VaultEdge {
  source: string;
  target: string;
}

interface VaultData {
  nodes: VaultNode[];
  edges: VaultEdge[];
  stats: {
    total_notes: number;
    total_links: number;
    categories: Record<string, number>;
    phantom_nodes?: number;
  };
}

// ── Force simulation node ──

interface SimNode extends VaultNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pinned: boolean;
}

// ── Category colors & labels ──

const CAT_COLORS: Record<string, string> = {
  decisions: "#3B82F6",
  topics: "#8B5CF6",
  people: "#F59E0B",
  formulas: "#22C55E",
  lessons: "#EF4444",
  trends: "#06B6D4",
  projects: "#EC4899",
  preferences: "#A855F7",
  phantom: "#3F3F46",
};

const CAT_LABELS: Record<string, string> = {
  decisions: "Decisiones",
  topics: "Temas",
  people: "Personas",
  formulas: "Fórmulas",
  lessons: "Lecciones",
  trends: "Tendencias",
  projects: "Proyectos",
  preferences: "Preferencias",
  phantom: "Sin crear",
};

// ── Force-directed graph engine ──

function createSimulation(nodes: SimNode[], edges: VaultEdge[]) {
  const REPULSION = 3000;
  const ATTRACTION = 0.008;
  const CENTER_GRAVITY = 0.01;
  const DAMPING = 0.85;
  const MIN_DIST = 60;

  function tick() {
    // Reset forces
    for (const n of nodes) {
      if (n.pinned) continue;
      let fx = 0, fy = 0;

      // Repulsion between all nodes (Coulomb)
      for (const m of nodes) {
        if (m.id === n.id) continue;
        const dx = n.x - m.x;
        const dy = n.y - m.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
        const force = REPULSION / (dist * dist);
        fx += (dx / dist) * force;
        fy += (dy / dist) * force;
      }

      // Attraction on edges (Hooke)
      for (const e of edges) {
        let other: SimNode | undefined;
        if (e.source === n.id) other = nodes.find(nd => nd.id === e.target);
        if (e.target === n.id) other = nodes.find(nd => nd.id === e.source);
        if (!other) continue;
        const dx = other.x - n.x;
        const dy = other.y - n.y;
        fx += dx * ATTRACTION;
        fy += dy * ATTRACTION;
      }

      // Center gravity
      fx -= n.x * CENTER_GRAVITY;
      fy -= n.y * CENTER_GRAVITY;

      n.vx = (n.vx + fx) * DAMPING;
      n.vy = (n.vy + fy) * DAMPING;
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return { tick };
}

// ── Shape drawing helper ──

function drawNodeShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  _category: string
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
}

// ── Component ──

export default function VaultPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<VaultNode | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [searchMatches, setSearchMatches] = useState<Set<string>>(new Set());
  const [searchIndex, setSearchIndex] = useState(0);

  // Simulation state refs (avoid re-renders on every frame)
  const simNodesRef = useRef<SimNode[]>([]);
  const edgesRef = useRef<VaultEdge[]>([]);
  const simRef = useRef<{ tick: () => void } | null>(null);
  const animRef = useRef<number>(0);
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const targetPanRef = useRef<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const tickCountRef = useRef(0);
  const nodeLinkCountRef = useRef<Map<string, number>>(new Map());

  // ── Data fetching ──

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vault?t=${Date.now()}`);
      if (res.ok) {
        const vaultData: VaultData = await res.json();
        setData(vaultData);

        // Initialize simulation nodes
        const simNodes: SimNode[] = vaultData.nodes.map((n, i) => {
          const angle = (i / vaultData.nodes.length) * Math.PI * 2;
          const radius = 150 + Math.random() * 100;
          return {
            ...n,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: n.category === "phantom" ? 6 : Math.max(10, Math.min(24, 8 + n.mentions * 3 + n.links.length * 2)),
            pinned: false,
          };
        });

        simNodesRef.current = simNodes;
        edgesRef.current = vaultData.edges;
        simRef.current = createSimulation(simNodes, vaultData.edges);
        tickCountRef.current = 0;

        // Build link count map for parallax layers
        const linkCounts = new Map<string, number>();
        for (const edge of vaultData.edges) {
          linkCounts.set(edge.source, (linkCounts.get(edge.source) || 0) + 1);
          linkCounts.set(edge.target, (linkCounts.get(edge.target) || 0) + 1);
        }
        nodeLinkCountRef.current = linkCounts;
      }
    } catch (e) {
      console.error("Error loading vault:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Read note content ──

  const loadNoteContent = async (slug: string) => {
    try {
      const res = await fetch(`/api/vault`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", slug }),
      });
      if (res.ok) {
        const d = await res.json();
        setNoteContent(d.content || "");
      }
    } catch {
      setNoteContent("Error loading note");
    }
  };

  // ── Canvas coordinate helpers ──

  const screenToWorld = useCallback((sx: number, sy: number, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    return {
      x: (sx - rect.left - cx - panRef.current.x) / zoomRef.current,
      y: (sy - rect.top - cy - panRef.current.y) / zoomRef.current,
    };
  }, []);

  const findNodeAt = useCallback((wx: number, wy: number): SimNode | null => {
    for (let i = simNodesRef.current.length - 1; i >= 0; i--) {
      const n = simNodesRef.current[i];
      const dx = n.x - wx;
      const dy = n.y - wy;
      if (dx * dx + dy * dy < (n.radius + 4) * (n.radius + 4)) return n;
    }
    return null;
  }, []);

  // ── Mouse handlers ──

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = screenToWorld(e.clientX, e.clientY, canvas);
    const node = findNodeAt(w.x, w.y);

    if (node) {
      dragRef.current = { nodeId: node.id, offsetX: w.x - node.x, offsetY: w.y - node.y };
      node.pinned = true;
    } else {
      isPanningRef.current = true;
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [screenToWorld, findNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (dragRef.current) {
      const w = screenToWorld(e.clientX, e.clientY, canvas);
      const node = simNodesRef.current.find(n => n.id === dragRef.current!.nodeId);
      if (node) {
        node.x = w.x - dragRef.current.offsetX;
        node.y = w.y - dragRef.current.offsetY;
        node.vx = 0;
        node.vy = 0;
      }
    } else if (isPanningRef.current) {
      // Cancel any ongoing pan animation when user manually pans
      targetPanRef.current = null;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      panRef.current.x += dx;
      panRef.current.y += dy;
    } else {
      // Hover detection
      const w = screenToWorld(e.clientX, e.clientY, canvas);
      const node = findNodeAt(w.x, w.y);
      setHoveredNode(node?.id || null);
      canvas.style.cursor = node ? "pointer" : "grab";
    }
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, [screenToWorld, findNodeAt]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current) {
      const node = simNodesRef.current.find(n => n.id === dragRef.current!.nodeId);
      if (node) node.pinned = false;
      dragRef.current = null;
    }
    isPanningRef.current = false;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = screenToWorld(e.clientX, e.clientY, canvas);
    const node = findNodeAt(w.x, w.y);
    if (node && node.category !== "phantom") {
      setSelectedNode(node);
      loadNoteContent(node.id);
      // Animate pan to center the selected node
      targetPanRef.current = { x: -node.x * zoomRef.current, y: -node.y * zoomRef.current };
    } else if (!dragRef.current) {
      setSelectedNode(null);
      setNoteContent("");
    }
  }, [screenToWorld, findNodeAt]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    targetZoomRef.current = Math.max(0.2, Math.min(5, targetZoomRef.current * factor));
  }, []);

  // ── Render loop ──

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function render() {
      if (!ctx || !canvas) return;
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;

      // Smooth zoom lerp
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.15;

      // Smooth pan lerp (click-to-center animation)
      if (targetPanRef.current) {
        const dx = targetPanRef.current.x - panRef.current.x;
        const dy = targetPanRef.current.y - panRef.current.y;
        panRef.current.x += dx * 0.12;
        panRef.current.y += dy * 0.12;
        // Stop animating when close enough
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
          panRef.current.x = targetPanRef.current.x;
          panRef.current.y = targetPanRef.current.y;
          targetPanRef.current = null;
        }
      }

      const zoom = zoomRef.current;
      const pan = panRef.current;

      // Run simulation (slow down over time)
      if (simRef.current && tickCountRef.current < 600) {
        simRef.current.tick();
        tickCountRef.current++;
      }

      // Clear
      ctx.fillStyle = "#0A0A0B";
      ctx.fillRect(0, 0, W, H);

      // Grid dots
      ctx.fillStyle = "#1A1A1D";
      const gridSize = 40 * zoom;
      const ox = ((cx + pan.x) % gridSize + gridSize) % gridSize;
      const oy = ((cy + pan.y) % gridSize + gridSize) % gridSize;
      for (let x = ox; x < W; x += gridSize) {
        for (let y = oy; y < H; y += gridSize) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      const nodes = simNodesRef.current;
      const edges = edgesRef.current;
      const linkCounts = nodeLinkCountRef.current;

      // Build node lookup
      const nodeMap = new Map<string, SimNode>();
      for (const n of nodes) nodeMap.set(n.id, n);

      // Compute max distance from center for depth effect
      let maxDist = 1;
      for (const n of nodes) {
        const d = Math.sqrt(n.x * n.x + n.y * n.y);
        if (d > maxDist) maxDist = d;
      }

      // Split nodes into background (< 3 links) and foreground (>= 3 links)
      const bgNodes: SimNode[] = [];
      const fgNodes: SimNode[] = [];
      for (const n of nodes) {
        const lc = linkCounts.get(n.id) || 0;
        if (lc < 3) bgNodes.push(n);
        else fgNodes.push(n);
      }

      // ── Render pass helper ──
      const renderLayer = (layerNodes: SimNode[], parallaxFactor: number) => {
        const layerPanX = pan.x * parallaxFactor;
        const layerPanY = pan.y * parallaxFactor;

        ctx.save();
        ctx.translate(cx + layerPanX, cy + layerPanY);
        ctx.scale(zoom, zoom);

        // Draw edges for this layer's nodes
        const layerNodeIds = new Set(layerNodes.map(n => n.id));
        for (const e of edges) {
          const src = nodeMap.get(e.source);
          const tgt = nodeMap.get(e.target);
          if (!src || !tgt) continue;
          // Draw edge if at least one endpoint is in this layer
          if (!layerNodeIds.has(e.source) && !layerNodeIds.has(e.target)) continue;
          // Skip if both nodes belong to the other layer (avoid double draw)
          if (!layerNodeIds.has(e.source) || !layerNodeIds.has(e.target)) continue;

          const isHighlighted = hoveredNode === e.source || hoveredNode === e.target ||
                                selectedNode?.id === e.source || selectedNode?.id === e.target;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(tgt.x, tgt.y);
          ctx.strokeStyle = isHighlighted ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.06)";
          ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
          ctx.stroke();
        }

        // Draw nodes
        const hasSearch = searchMatches.size > 0;
        for (const n of layerNodes) {
          const isSelected = selectedNode?.id === n.id;
          const isHovered = hoveredNode === n.id;
          const isSearchMatch = hasSearch && searchMatches.has(n.id);
          const isConnected = selectedNode && (
            edges.some(e => (e.source === selectedNode.id && e.target === n.id) ||
                            (e.target === selectedNode.id && e.source === n.id))
          );
          const dimmed = hasSearch
            ? !isSearchMatch && !isSelected
            : (selectedNode && !isSelected && !isConnected);

          // Depth effect: farther nodes are smaller and more transparent
          const distFromCenter = Math.sqrt(n.x * n.x + n.y * n.y);
          const depthZ = maxDist > 0 ? distFromCenter / maxDist : 0;
          const depthScale = 1.0 - depthZ * 0.3; // 1.0 at center, 0.7 at edge
          const depthOpacity = 1.0 - depthZ * 0.25; // 1.0 at center, 0.75 at edge

          const effectiveRadius = n.radius * depthScale;

          ctx.save();
          ctx.globalAlpha = depthOpacity;

          // Node glow
          if (isSelected || isHovered || isSearchMatch) {
            ctx.beginPath();
            ctx.arc(n.x, n.y, effectiveRadius + (isSearchMatch && !isSelected ? 10 : 8), 0, Math.PI * 2);
            const glowRadius = isSearchMatch && !isSelected ? 10 : 8;
            const glow = ctx.createRadialGradient(n.x, n.y, effectiveRadius, n.x, n.y, effectiveRadius + glowRadius);
            glow.addColorStop(0, n.color + (isSearchMatch ? "60" : "40"));
            glow.addColorStop(1, "transparent");
            ctx.fillStyle = glow;
            ctx.fill();
          }

          // Node shape (category-based)
          drawNodeShape(ctx, n.x, n.y, effectiveRadius, n.category);
          const alphaHex = n.category === "phantom"
            ? "60"
            : Math.round(128 + (n.confidence || 0.7) * 127).toString(16).padStart(2, "0");
          ctx.fillStyle = dimmed ? n.color + "30" : n.color + alphaHex;
          ctx.fill();

          // Border
          if (isSelected) {
            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (isSearchMatch) {
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 2;
            ctx.stroke();
          } else if (isHovered) {
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }

          // Label
          const fontSize = Math.max(9, Math.min(13, effectiveRadius * 0.8));
          ctx.font = `${isSelected || isHovered ? "600" : "400"} ${fontSize}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = dimmed ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.85)";
          ctx.fillText(n.label, n.x, n.y + effectiveRadius + 4);

          // Category icon (small dot below label for phantom)
          if (n.category === "phantom") {
            ctx.beginPath();
            ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = "#3F3F46";
            ctx.fill();
          }

          ctx.restore();
        }

        ctx.restore();
      };

      // Draw cross-layer edges first (between bg and fg nodes)
      const bgNodeIds = new Set(bgNodes.map(n => n.id));
      const fgNodeIds = new Set(fgNodes.map(n => n.id));
      ctx.save();
      ctx.translate(cx + pan.x, cy + pan.y);
      ctx.scale(zoom, zoom);
      for (const e of edges) {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) continue;
        const crossLayer = (bgNodeIds.has(e.source) && fgNodeIds.has(e.target)) ||
                           (fgNodeIds.has(e.source) && bgNodeIds.has(e.target));
        if (!crossLayer) continue;
        const isHighlighted = hoveredNode === e.source || hoveredNode === e.target ||
                              selectedNode?.id === e.source || selectedNode?.id === e.target;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = isHighlighted ? "rgba(255,255,255,0.20)" : "rgba(255,255,255,0.04)";
        ctx.lineWidth = isHighlighted ? 1.5 : 0.5;
        ctx.stroke();
      }
      ctx.restore();

      // Render background layer (parallax 0.85), then foreground layer (parallax 1.0)
      renderLayer(bgNodes, 0.85);
      renderLayer(fgNodes, 1.0);

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [data, hoveredNode, selectedNode, searchMatches]);

  // ── Zoom controls ──

  const zoomIn = () => { targetZoomRef.current = Math.min(5, targetZoomRef.current * 1.3); };
  const zoomOut = () => { targetZoomRef.current = Math.max(0.2, targetZoomRef.current * 0.7); };
  const resetView = () => { targetZoomRef.current = 1; targetPanRef.current = { x: 0, y: 0 }; };

  // ── Search ──

  const filteredCategories = data?.stats.categories || {};

  // ── Render ──

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-zinc-100">Vault</h3>
          {data && (
            <span className="text-xs text-zinc-500">
              {data.stats.total_notes} notas &middot; {data.stats.total_links} conexiones
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex items-center gap-1.5">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar en vault..."
                value={searchQuery}
                onChange={e => {
                  const q = e.target.value;
                  setSearchQuery(q);
                  if (q) {
                    const matches = simNodesRef.current.filter(n =>
                      n.label.toLowerCase().includes(q.toLowerCase()) ||
                      n.id.toLowerCase().includes(q.toLowerCase()) ||
                      n.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
                    );
                    const matchIds = new Set(matches.map(m => m.id));
                    setSearchMatches(matchIds);
                    setSearchIndex(0);
                    if (matches.length > 0) {
                      setSelectedNode(matches[0]);
                      if (matches[0].category !== "phantom") loadNoteContent(matches[0].id);
                      targetPanRef.current = { x: -matches[0].x * zoomRef.current, y: -matches[0].y * zoomRef.current };
                    }
                  } else {
                    setSearchMatches(new Set());
                    setSearchIndex(0);
                  }
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchMatches.size > 1) {
                    const matchArr = simNodesRef.current.filter(n => searchMatches.has(n.id));
                    const nextIdx = (searchIndex + 1) % matchArr.length;
                    setSearchIndex(nextIdx);
                    const next = matchArr[nextIdx];
                    setSelectedNode(next);
                    if (next.category !== "phantom") loadNoteContent(next.id);
                    targetPanRef.current = { x: -next.x * zoomRef.current, y: -next.y * zoomRef.current };
                  }
                }}
                className="pl-8 pr-3 py-1.5 text-sm bg-[#141416] border border-[#27272A] rounded-lg text-zinc-300 placeholder-zinc-600 w-48 focus:outline-none focus:border-[#3F3F46]"
              />
            </div>
            {searchMatches.size > 0 && (
              <span className="text-[10px] font-medium text-zinc-500 whitespace-nowrap">
                {searchIndex + 1}/{searchMatches.size}
              </span>
            )}
          </div>
          {/* Zoom controls */}
          <button onClick={zoomOut} className="p-1.5 rounded-lg bg-[#141416] border border-[#27272A] text-zinc-400 hover:text-zinc-200 transition-colors">
            <ZoomOut size={14} />
          </button>
          <button onClick={zoomIn} className="p-1.5 rounded-lg bg-[#141416] border border-[#27272A] text-zinc-400 hover:text-zinc-200 transition-colors">
            <ZoomIn size={14} />
          </button>
          <button onClick={resetView} className="p-1.5 rounded-lg bg-[#141416] border border-[#27272A] text-zinc-400 hover:text-zinc-200 transition-colors">
            <Maximize2 size={14} />
          </button>
          <button onClick={loadData} className="p-1.5 rounded-lg bg-[#141416] border border-[#27272A] text-zinc-400 hover:text-zinc-200 transition-colors">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Graph */}
        <div className="flex-1 relative rounded-xl border border-[#27272A] overflow-hidden" style={{ background: "#0A0A0B" }} ref={containerRef}>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            className="w-full h-full"
            style={{ cursor: "grab" }}
          />

          {/* Legend overlay */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            {Object.entries(CAT_COLORS).filter(([k]) => k !== "phantom").map(([cat, color]) => {
              const count = filteredCategories[cat] || 0;
              if (count === 0) return null;
              const isActive = filterCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(isActive ? null : cat)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                    isActive ? "bg-white/10 border border-white/20" : "bg-black/40 border border-transparent hover:bg-black/60"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-zinc-400">{CAT_LABELS[cat] || cat}</span>
                  <span className="text-zinc-600">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Empty state */}
          {!loading && data && data.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <FileText size={32} className="mx-auto text-zinc-600 mb-3" />
                <p className="text-zinc-400 text-sm">El vault esta vacio</p>
                <p className="text-zinc-600 text-xs mt-1">Las notas apareceran aqui cuando los agentes completen tareas</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — note detail */}
        {selectedNode && (
          <div className="w-80 rounded-xl border border-[#27272A] flex flex-col overflow-hidden" style={{ background: "#141416" }}>
            {/* Header */}
            <div className="p-4 border-b border-[#27272A] flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedNode.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: selectedNode.color }}>
                    {CAT_LABELS[selectedNode.category] || selectedNode.category}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-zinc-100 truncate">{selectedNode.label}</h4>
              </div>
              <button
                onClick={() => { setSelectedNode(null); setNoteContent(""); }}
                className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Meta */}
            <div className="px-4 py-3 border-b border-[#1C1C1F] space-y-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <User size={12} />
                <span>{selectedNode.author || "system"}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Calendar size={12} />
                <span>{selectedNode.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <FileText size={12} />
                <span>{selectedNode.word_count} palabras &middot; {selectedNode.mentions} menciones</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Link2 size={12} />
                <span>{selectedNode.links.length} conexiones</span>
              </div>
              {selectedNode.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag size={12} className="text-zinc-500" />
                  {selectedNode.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#27272A] text-zinc-400">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Connected nodes */}
            {selectedNode.links.length > 0 && (
              <div className="px-4 py-3 border-b border-[#1C1C1F]">
                <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Conexiones</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.links.map((link, i) => {
                    const linkedNode = simNodesRef.current.find(n => n.id === link || n.id.toLowerCase() === link.toLowerCase());
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          if (linkedNode) {
                            setSelectedNode(linkedNode);
                            if (linkedNode.category !== "phantom") loadNoteContent(linkedNode.id);
                            targetPanRef.current = { x: -linkedNode.x * zoomRef.current, y: -linkedNode.y * zoomRef.current };
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded-md border transition-all hover:border-zinc-500"
                        style={{
                          background: (linkedNode?.color || "#3F3F46") + "15",
                          borderColor: (linkedNode?.color || "#3F3F46") + "40",
                          color: linkedNode?.color || "#71717A",
                        }}
                      >
                        {link}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note content */}
            <div className="flex-1 overflow-auto px-4 py-3">
              {noteContent ? (
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {noteContent.split("---").slice(2).join("---").trim() || noteContent}
                </pre>
              ) : (
                <p className="text-xs text-zinc-600 italic">Cargando contenido...</p>
              )}
            </div>

            {/* Confidence bar */}
            <div className="px-4 py-2 border-t border-[#1C1C1F]">
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span>Confianza</span>
                <span>{Math.round(selectedNode.confidence * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#27272A] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${selectedNode.confidence * 100}%`,
                    background: selectedNode.confidence > 0.6 ? "#22C55E" : selectedNode.confidence > 0.3 ? "#F59E0B" : "#EF4444",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

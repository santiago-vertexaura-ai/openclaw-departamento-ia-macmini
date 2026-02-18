"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp } from "lucide-react";

interface DailyData {
  alfred: number;
  roberto: number;
  andres: number;
}

interface CostHistoryResponse {
  daily: Record<string, DailyData>;
}

const AGENT_COLORS = {
  alfred: "#06B6D4",
  roberto: "#A855F7",
  andres: "#F97316",
};

export default function CostTrend() {
  const [history, setHistory] = useState<Record<string, DailyData>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch(`/api/cost-history?t=${Date.now()}`)
      .then((r) => r.json())
      .then((data: CostHistoryResponse) => setHistory(data.daily || {}))
      .catch(() => {});
  }, []);

  // Get last 7 days of data
  const days = Object.keys(history).sort().slice(-7);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || days.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padLeft = 35;
    const padRight = 8;
    const padTop = 8;
    const padBottom = 18;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;

    // Calculate totals per day
    const totals = days.map((d) => {
      const day = history[d];
      return (day?.alfred || 0) + (day?.roberto || 0) + (day?.andres || 0);
    });

    const maxVal = Math.max(...totals, 0.5);

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "#27272A";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(W - padRight, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "#52525B";
    ctx.font = "9px system-ui";
    ctx.textAlign = "right";
    for (let i = 0; i <= 3; i++) {
      const y = padTop + (chartH / 3) * i;
      const val = maxVal - (maxVal / 3) * i;
      ctx.fillText(`$${val.toFixed(0)}`, padLeft - 4, y + 3);
    }

    // X-axis labels (day of week)
    ctx.textAlign = "center";
    ctx.fillStyle = "#52525B";
    const dayNames = ["D", "L", "M", "X", "J", "V", "S"];
    days.forEach((d, i) => {
      const x = padLeft + (chartW / (days.length - 1 || 1)) * i;
      const dow = new Date(d + "T12:00:00").getDay();
      ctx.fillText(dayNames[dow], x, H - 2);
    });

    if (days.length < 2) return;

    // Draw stacked area chart
    const agents = ["andres", "roberto", "alfred"] as const;

    // Build cumulative stacks
    for (let a = 0; a < agents.length; a++) {
      const agent = agents[a];
      const color = AGENT_COLORS[agent];

      ctx.beginPath();
      ctx.fillStyle = color + "30";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      // Top line (cumulative up to this agent)
      const points: [number, number][] = [];
      days.forEach((d, i) => {
        const day = history[d];
        let cumulative = 0;
        for (let j = 0; j <= a; j++) {
          cumulative += day?.[agents[j]] || 0;
        }
        const x = padLeft + (chartW / (days.length - 1)) * i;
        const y = padTop + chartH - (cumulative / maxVal) * chartH;
        points.push([x, y]);
      });

      // Bottom line (cumulative up to previous agent)
      const bottomPoints: [number, number][] = [];
      days.forEach((d, i) => {
        const day = history[d];
        let cumulative = 0;
        for (let j = 0; j < a; j++) {
          cumulative += day?.[agents[j]] || 0;
        }
        const x = padLeft + (chartW / (days.length - 1)) * i;
        const y = padTop + chartH - (cumulative / maxVal) * chartH;
        bottomPoints.push([x, y]);
      });

      // Draw filled area
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        ctx.lineTo(bottomPoints[i][0], bottomPoints[i][1]);
      }
      ctx.closePath();
      ctx.fill();

      // Draw top line
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }
  }, [history, days]);

  const totalWeek = days.reduce((sum, d) => {
    const day = history[d];
    return sum + (day?.alfred || 0) + (day?.roberto || 0) + (day?.andres || 0);
  }, 0);

  return (
    <div
      className="rounded-xl border border-[#27272A] p-4"
      style={{ background: "#141416" }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-zinc-500" />
          <h3 className="text-xs font-semibold text-zinc-400">Coste semanal</h3>
        </div>
        <span className="text-xs font-bold text-zinc-200">
          ${totalWeek.toFixed(2)}
        </span>
      </div>

      {/* Legend */}
      <div className="flex gap-3 mb-2">
        {(["alfred", "roberto", "andres"] as const).map((agent) => (
          <div key={agent} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: AGENT_COLORS[agent] }}
            />
            <span className="text-[9px] text-zinc-500 capitalize">{agent === "andres" ? "andrés" : agent}</span>
          </div>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: "90px" }}
      />
    </div>
  );
}

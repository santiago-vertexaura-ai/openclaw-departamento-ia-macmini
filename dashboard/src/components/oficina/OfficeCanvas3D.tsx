"use client";

import { useState, useEffect, Component, ReactNode } from "react";
import { AllAgentsStatus } from "@/hooks/useAgentStatus";

// Error boundary to catch Three.js/WebGL crashes
class Canvas3DErrorBoundary extends Component<
  { children: ReactNode },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message || "Error desconocido" };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          className="h-full w-full flex items-center justify-center"
          style={{ background: "#060810" }}
        >
          <div className="text-center max-w-lg">
            <div className="text-red-400 text-sm font-mono mb-2">
              Error en oficina 3D
            </div>
            <div className="text-zinc-500 text-xs font-mono break-all">
              {this.state.error}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function OfficeCanvas3D({ agents }: { agents: AllAgentsStatus }) {
  const [Office3DScene, setScene] = useState<React.ComponentType<{ agents: AllAgentsStatus }> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    import("./Office3DScene")
      .then((mod) => {
        setScene(() => mod.default);
      })
      .catch((err) => {
        console.error("Failed to load Office3DScene:", err);
        setLoadError(err?.message || String(err));
      });
  }, []);

  if (loadError) {
    return (
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ background: "#060810" }}
      >
        <div className="text-center max-w-lg">
          <div className="text-red-400 text-sm font-mono mb-2">
            Error cargando oficina 3D
          </div>
          <div className="text-zinc-500 text-xs font-mono break-all">
            {loadError}
          </div>
        </div>
      </div>
    );
  }

  if (!Office3DScene) {
    return (
      <div
        className="h-full w-full flex items-center justify-center"
        style={{ background: "#060810" }}
      >
        <div className="text-zinc-600 text-sm font-mono">
          Cargando oficina 3D...
        </div>
      </div>
    );
  }

  return (
    <Canvas3DErrorBoundary>
      <Office3DScene agents={agents} />
    </Canvas3DErrorBoundary>
  );
}

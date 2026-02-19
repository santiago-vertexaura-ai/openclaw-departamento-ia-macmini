"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        background: "#0A0A0B",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ color: "#EF4444", marginBottom: "1rem" }}>Dashboard Error</h1>
      <pre
        style={{
          background: "#141416",
          border: "1px solid #27272A",
          borderRadius: "8px",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "13px",
          marginBottom: "1rem",
        }}
      >
        {error.message}
      </pre>
      <pre
        style={{
          background: "#141416",
          border: "1px solid #27272A",
          borderRadius: "8px",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontSize: "11px",
          color: "#71717A",
          marginBottom: "1rem",
        }}
      >
        {error.stack}
      </pre>
      <button
        onClick={reset}
        style={{
          background: "#3B82F6",
          color: "white",
          border: "none",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Reintentar
      </button>
    </div>
  );
}

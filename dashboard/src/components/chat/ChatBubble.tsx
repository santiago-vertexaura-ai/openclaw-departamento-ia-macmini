"use client";

import { Mic, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export type BubbleType = "user" | "assistant" | "system";

interface AttachmentInfo {
  name: string;
  type: "image" | "audio" | "document";
  url?: string;
  size: number;
}

interface ChatBubbleProps {
  type: BubbleType;
  content: string;
  timestamp?: string;
  attachments?: AttachmentInfo[];
}

export default function ChatBubble({ type, content, timestamp, attachments }: ChatBubbleProps) {
  if (type === "system") {
    return (
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
        <div
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            fontSize: 11,
            color: "rgba(250,204,21,0.7)",
            border: "1px solid rgba(250,204,21,0.08)",
            background: "rgba(250,204,21,0.04)",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  const isUser = type === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          maxWidth: "75%",
          padding: isUser ? "10px 16px" : "10px 16px",
          borderRadius: isUser ? "18px 18px 6px 18px" : "18px 18px 18px 6px",
          fontSize: 14,
          lineHeight: 1.55,
          color: isUser ? "#f0f0f2" : "#d4d4d8",
          border: isUser
            ? "1px solid rgba(59,130,246,0.12)"
            : "1px solid rgba(255,255,255,0.04)",
          background: isUser
            ? "rgba(59,130,246,0.14)"
            : "rgba(255,255,255,0.025)",
        }}
      >
        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {attachments.map((att, i) => (
              <div key={i}>
                {att.type === "image" && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{ maxWidth: 240, borderRadius: 12 }}
                  />
                ) : att.type === "audio" && att.url ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Mic size={14} style={{ color: isUser ? "#93c5fd" : "#71717a" }} />
                    <audio controls style={{ height: 32, maxWidth: 200, filter: "invert(1)" }}>
                      <source src={att.url} type="audio/webm" />
                    </audio>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: isUser ? "#93c5fd" : "#71717a",
                    }}
                  >
                    <FileText size={14} />
                    <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {att.name}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {content && (
          isUser ? (
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {content}
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-headings:my-2 prose-headings:text-zinc-200 prose-p:text-zinc-300 prose-a:text-blue-400 prose-strong:text-zinc-200 prose-code:text-purple-300 prose-code:bg-zinc-800/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-pre:bg-[#0A0A0B] prose-pre:border prose-pre:border-zinc-800 prose-blockquote:border-l-indigo-500 prose-blockquote:text-zinc-400 prose-li:text-zinc-300 prose-li:my-0.5 prose-ul:my-1 prose-ol:my-1" style={{ wordBreak: "break-word" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )
        )}
        {timestamp && (
          <p
            style={{
              fontSize: 10,
              marginTop: 6,
              marginBottom: 0,
              color: isUser ? "rgba(147,197,253,0.35)" : "rgba(113,113,122,0.5)",
            }}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}

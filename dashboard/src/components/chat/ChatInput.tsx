"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Mic, MicOff, Paperclip, X, FileText } from "lucide-react";

export interface Attachment {
  file: File;
  preview?: string;
  type: "image" | "audio" | "document";
}

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  disabled?: boolean;
}

function getAttachmentType(file: File): Attachment["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && attachments.length === 0) || disabled) return;
    onSend(trimmed, attachments.length > 0 ? attachments : undefined);
    setValue("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const type = getAttachmentType(file);
      const attachment: Attachment = { file, type };
      if (type === "image") {
        attachment.preview = URL.createObjectURL(file);
      }
      newAttachments.push(attachment);
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const att = prev[index];
      if (att.preview) URL.revokeObjectURL(att.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const startRecording = useCallback(async () => {
    try {
      // getUserMedia requires HTTPS on non-localhost origins
      if (typeof window !== "undefined" && window.location.protocol === "http:" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        const httpsUrl = `https://${window.location.hostname}:3443${window.location.pathname}`;
        alert(`El microfono requiere HTTPS.\n\nAccede desde:\n${httpsUrl}`);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setRecordingTime(0);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Transcribe via Whisper
        setTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("audio", blob, `audio-${Date.now()}.webm`);
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (res.ok) {
            const { text } = await res.json();
            if (text) {
              setValue((prev) => (prev ? prev + " " + text : text));
              setTranscribing(false);
              return;
            }
          }
        } catch {
          // Fall through to file attachment
        }
        setTranscribing(false);

        // Fallback: attach as audio file if transcription fails
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        setAttachments((prev) => [...prev, { file, type: "audio" }]);
      };

      mediaRecorder.start();
      setRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch {
      // Microphone permission denied or not available
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const canSend = value.trim() || attachments.length > 0;

  return (
    <div
      style={{
        margin: "0 20px",
        borderRadius: 20,
        border: focused ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        boxShadow: focused
          ? "0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.5)"
          : "0 4px 24px rgba(0,0,0,0.3)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Attachment preview bar */}
      {attachments.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "12px 16px 0",
            overflowX: "auto",
          }}
        >
          {attachments.map((att, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 11,
                color: "#a1a1aa",
                flexShrink: 0,
              }}
            >
              {att.type === "image" && att.preview ? (
                <img src={att.preview} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
              ) : att.type === "audio" ? (
                <Mic size={12} style={{ color: "#f87171" }} />
              ) : (
                <FileText size={12} style={{ color: "#60a5fa" }} />
              )}
              <span style={{ maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.file.name}</span>
              <span style={{ color: "#52525b" }}>{formatSize(att.file.size)}</span>
              <button
                onClick={() => removeAttachment(i)}
                style={{ color: "#52525b", cursor: "pointer", background: "none", border: "none", padding: 0, display: "flex" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#d4d4d8")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#52525b")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", alignItems: "end", gap: 6, padding: "10px 12px" }}>
        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || recording}
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#71717a",
            background: "transparent",
            border: "none",
            cursor: disabled || recording ? "not-allowed" : "pointer",
            opacity: disabled || recording ? 0.3 : 1,
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseOver={(e) => { if (!disabled && !recording) { e.currentTarget.style.color = "#d4d4d8"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}}
          onMouseOut={(e) => { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; }}
          title="Adjuntar archivo"
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf,.txt,.md,.json,.csv"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* Recording / transcribing indicator or textarea */}
        {recording || transcribing ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 12,
              border: transcribing ? "1px solid rgba(99,102,241,0.15)" : "1px solid rgba(239,68,68,0.15)",
              background: transcribing ? "rgba(99,102,241,0.05)" : "rgba(239,68,68,0.05)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: transcribing ? "#6366f1" : "#ef4444",
                boxShadow: transcribing ? "0 0 8px rgba(99,102,241,0.6)" : "0 0 8px rgba(239,68,68,0.6)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: 13, color: transcribing ? "#6366f1" : "#f87171", fontWeight: 500 }}>
              {transcribing ? "Transcribiendo..." : "Grabando..."}
            </span>
            {!transcribing && (
              <span style={{ fontSize: 12, color: "#71717a", fontFamily: "monospace" }}>{formatTime(recordingTime)}</span>
            )}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              background: "transparent",
              padding: "8px 4px",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#e4e4e7",
              border: "none",
              outline: "none",
              maxHeight: 140,
              opacity: disabled ? 0.5 : 1,
            }}
          />
        )}

        {/* Mic button */}
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={disabled}
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: recording ? "#fff" : "#71717a",
            background: recording ? "rgba(239,68,68,0.8)" : "transparent",
            border: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.3 : 1,
            boxShadow: recording ? "0 0 12px rgba(239,68,68,0.3)" : "none",
            transition: "all 0.15s",
          }}
          onMouseOver={(e) => { if (!disabled && !recording) { e.currentTarget.style.color = "#d4d4d8"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}}
          onMouseOut={(e) => { if (!recording) { e.currentTarget.style.color = "#71717a"; e.currentTarget.style.background = "transparent"; }}}
          title={recording ? "Parar grabacion" : "Grabar audio"}
        >
          {recording ? <MicOff size={15} /> : <Mic size={16} />}
        </button>

        {/* Send */}
        <button
          onClick={handleSubmit}
          disabled={disabled || !canSend}
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            background: canSend && !disabled ? "#3b82f6" : "rgba(59,130,246,0.15)",
            border: "none",
            cursor: canSend && !disabled ? "pointer" : "not-allowed",
            boxShadow: canSend && !disabled ? "0 0 20px rgba(59,130,246,0.3)" : "none",
            transition: "all 0.2s",
          }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

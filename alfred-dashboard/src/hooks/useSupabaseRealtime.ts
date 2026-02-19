"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type RealtimeCallback<T> = (payload: {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T | null;
  old: Partial<T> | null;
}) => void;

export function useSupabaseRealtime<T = Record<string, unknown>>(
  table: string,
  callback: RealtimeCallback<T>
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          callbackRef.current({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: (payload.new as T) || null,
            old: (payload.old as Partial<T>) || null,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}

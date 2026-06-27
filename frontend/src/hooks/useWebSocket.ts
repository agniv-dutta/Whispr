"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { WhisprSocket } from "@/lib/websocket";

interface UseWebSocketOptions {
  onMessage?: (msg: Record<string, unknown>) => void;
  onTypingStart?: (data: {
    conversation_id: string;
    user_id: string;
    display_name: string;
  }) => void;
  onTypingStop?: (data: {
    conversation_id: string;
    user_id: string;
    display_name: string;
  }) => void;
  onUserOnline?: (data: { user_id: string }) => void;
  onUserOffline?: (data: { user_id: string }) => void;
  onStatusUpdate?: (data: {
    conversation_id: string;
    user_id: string;
    message_id?: string;
    status: string;
  }) => void;
  onTimerUpdate?: (data: {
    conversation_id: string;
    timer_seconds: number | null;
  }) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

export function useWebSocket({
  onMessage,
  onTypingStart,
  onTypingStop,
  onUserOnline,
  onUserOffline,
  onStatusUpdate,
  onTimerUpdate,
  onConnected,
  onDisconnected,
}: UseWebSocketOptions = {}): {
  subscribe: (conversationId: string) => void;
  unsubscribe: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  connected: boolean;
} {
  const { token } = useAuth();
  const socketRef = useRef<WhisprSocket | null>(null);

  const subscribe = useCallback((conversationId: string) => {
    socketRef.current?.send("subscribe", { conversation_id: conversationId });
  }, []);

  const unsubscribe = useCallback((conversationId: string) => {
    socketRef.current?.send("unsubscribe", { conversation_id: conversationId });
  }, []);

  const sendTypingStart = useCallback((conversationId: string) => {
    socketRef.current?.send("typing_start", { conversation_id: conversationId });
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    socketRef.current?.send("typing_stop", { conversation_id: conversationId });
  }, []);

  useEffect(() => {
    if (!token) return;

    const socket = WhisprSocket.getInstance(token);
    socketRef.current = socket;

    const handlers = [
      ["new_message", onMessage],
      ["typing_start", onTypingStart],
      ["typing_stop", onTypingStop],
      ["user_online", onUserOnline],
      ["user_offline", onUserOffline],
      ["status_update", onStatusUpdate],
      ["timer_update", onTimerUpdate],
      ["__connected", onConnected],
      ["__disconnected", onDisconnected],
    ] as const;

    for (const [event, handler] of handlers) {
      if (handler) {
        socket.on(event, handler as (data: Record<string, unknown>) => void);
      }
    }

    return () => {
      for (const [event, handler] of handlers) {
        if (handler) {
          socket.off(event, handler as (data: Record<string, unknown>) => void);
        }
      }
    };
  }, [
    token,
    onMessage,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onStatusUpdate,
    onTimerUpdate,
    onConnected,
    onDisconnected,
  ]);

  return {
    subscribe,
    unsubscribe,
    sendTypingStart,
    sendTypingStop,
    connected: socketRef.current?.connected ?? false,
  };
}

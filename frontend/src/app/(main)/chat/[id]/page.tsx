"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage, Conversation } from "@/lib/types";
import { getDateLabel } from "@/lib/format";
import { toastError, toastSuccess } from "@/lib/toast";
import { useSound } from "@/hooks/useSound";
import { useAnalytics } from "@/lib/analytics";
import { MessageSkeleton } from "@/components/Skeletons";
import MessageBubble from "@/components/MessageBubble";
import MessageInput from "@/components/MessageInput";
import TypingIndicator from "@/components/TypingIndicator";
import ChatHeader from "@/components/ChatHeader";
import GroupInfoPanel from "@/components/GroupInfoPanel";

const PAGE_SIZE = 50;

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser, logout } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{
    id: string;
    sender_name: string;
    content: string;
  } | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [otherOnline, setOtherOnline] = useState<boolean | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEncryptionBanner, setShowEncryptionBanner] = useState(true);
  const [notifBanner, setNotifBanner] = useState<{ sender: string; content: string; convId: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeight = useRef(0);
  const initScrollDone = useRef(false);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const sound = useSound();
  const { trackMessageSent, trackDeliveryTime } = useAnalytics();

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  const onNewMessage = useCallback((data: Record<string, unknown>) => {
    const msg = data.message as Record<string, unknown> | undefined;
    if (!msg) return;
    if (msg.conversation_id !== id) {
      const s = msg.sender as Record<string, unknown> | undefined;
      setNotifBanner({
        sender: (s?.display_name as string) ?? "Someone",
        content: (msg.content as string) ?? "",
        convId: msg.conversation_id as string,
      });
      setTimeout(() => setNotifBanner(null), 5000);
      return;
    }
    sound.play();
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg!.id)) return prev;
      return [...prev, msg as unknown as ChatMessage];
    });
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [id]);

  const onStatusUpdate = useCallback((data: Record<string, unknown>) => {
    if (data.conversation_id !== id) return;
    setMessages((prev) =>
      prev.map((m) => {
        if (data.message_id && m.id !== data.message_id) return m;
        return {
          ...m,
          statuses: [
            ...m.statuses.filter((s) => s.user_id !== data.user_id),
            {
              user_id: data.user_id as string,
              status: data.status as string,
              updated_at: new Date().toISOString(),
            },
          ],
        };
      }),
    );
  }, [id]);

  const onTypingStart = useCallback((data: Record<string, unknown>) => {
    if (data.conversation_id !== id || data.user_id === currentUser?.id) return;
    setTypingNames((prev) => {
      if (prev.includes(data.display_name as string)) return prev;
      return [...prev, data.display_name as string];
    });
    if (typingTimers.current.has(data.user_id as string)) {
      clearTimeout(typingTimers.current.get(data.user_id as string));
    }
  }, [id, currentUser?.id]);

  const onTypingStop = useCallback((data: Record<string, unknown>) => {
    if (data.conversation_id !== id || data.user_id === currentUser?.id) return;
    setTypingNames((prev) => prev.filter((n) => n !== data.display_name));
    if (typingTimers.current.has(data.user_id as string)) {
      clearTimeout(typingTimers.current.get(data.user_id as string));
      typingTimers.current.delete(data.user_id as string);
    }
  }, [id, currentUser?.id]);

  const onUserOnline = useCallback((data: Record<string, unknown>) => {
    if (conversation?.other_user?.id === data.user_id) setOtherOnline(true);
  }, [conversation?.other_user?.id]);

  const onUserOffline = useCallback((data: Record<string, unknown>) => {
    if (conversation?.other_user?.id === data.user_id) setOtherOnline(false);
  }, [conversation?.other_user?.id]);

  const handleTimerChange = useCallback(async (seconds: number | null) => {
    try {
      const { data } = await api.put(`/conversations/${id}/disappearing`, { timer_seconds: seconds });
      setConversation((prev) => prev ? { ...prev, timer_seconds: data.timer_seconds } : prev);
    } catch {
      toastError("Failed to update disappearing messages");
    }
  }, [id]);

  const onTimerUpdate = useCallback((data: Record<string, unknown>) => {
    if (data.conversation_id !== id) return;
    setConversation((prev) =>
      prev ? { ...prev, timer_seconds: (data.timer_seconds as number | null) ?? null } : prev
    );
  }, [id]);

  const ws = useWebSocket({
    onMessage: onNewMessage,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
    onStatusUpdate,
    onTimerUpdate,
  });

  const fetchMessages = useCallback(
    async (beforeId?: string) => {
      try {
        const params: Record<string, string | number> = { limit: PAGE_SIZE };
        if (beforeId) params.before = beforeId;
        const { data } = await api.get(`/chats/${id}/messages`, { params });
        return data as ChatMessage[];
      } catch {
        toastError("Failed to load messages");
        return [];
      }
    },
    [id],
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [msgs, conv] = await Promise.all([
      fetchMessages(),
      api.get("/conversations/").then((r) => {
        const found = (r.data as Conversation[]).find((c: Conversation) => c.id === id);
        return found ?? null;
      }).catch(() => null),
    ]);
    setMessages(Array.isArray(msgs) ? msgs : []);
    setConversation(conv);
    setOtherOnline(conv?.other_user?.is_online ?? null);
    setHasMore(msgs.length >= PAGE_SIZE);
    setLoading(false);
    initScrollDone.current = false;
  }, [fetchMessages, id]);

  const loadOlder = useCallback(async () => {
    if (!hasMore || loading || messages.length === 0) return;
    const oldestId = messages[0].id;
    prevScrollHeight.current = containerRef.current?.scrollHeight ?? 0;
    const older = await fetchMessages(oldestId);
    if (older.length === 0) {
      setHasMore(false);
      return;
    }
    setMessages((prev) => [...older, ...prev]);
    setHasMore(older.length >= PAGE_SIZE);
  }, [hasMore, loading, messages, fetchMessages]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  useEffect(() => {
    if (initScrollDone.current) return;
    if (!loading && messages.length > 0 && bottomRef.current) {
      bottomRef.current.scrollIntoView();
      initScrollDone.current = true;
    }
  }, [loading, messages]);

  useEffect(() => {
    if (!initScrollDone.current) return;
    if (prevScrollHeight.current > 0 && containerRef.current) {
      const newScrollHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newScrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages]);

  useEffect(() => {
    ws.subscribe(id);
    return () => ws.unsubscribe(id);
  }, [id, ws]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasMore && !loading) loadOlder();
  }, [hasMore, loading, loadOlder]);

  useEffect(() => {
    if (!id || !currentUser?.id) return;
    const timer = setTimeout(async () => {
      try { await api.put(`/chats/${id}/read`); } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [id, currentUser?.id]);

  const handleSend = async (
    content: string,
    replyToId: string | null,
    attachment?: { url: string; file_type: string; file_size: number; file_name: string },
  ) => {
    const start = performance.now();
    try {
      const body: Record<string, unknown> = { content, reply_to_id: replyToId };
      if (attachment) {
        body.type = attachment.file_type.startsWith("image/") ? "image" : "file";
        body.attachment = attachment;
      }
      await api.post(`/chats/${id}/messages`, body);
      trackDeliveryTime(Math.round(performance.now() - start));
      trackMessageSent();
      setReplyTo(null);
      toastSuccess("Message sent");
    } catch {
      toastError("Failed to send message");
    }
  };

  const handleReplyClick = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary/40", "rounded-2xl");
      setTimeout(() => el.classList.remove("ring-2", "ring-primary/40", "rounded-2xl"), 2000);
    }
  };

  const handleMessageClick = (msg: ChatMessage) => {
    setReplyTo({
      id: msg.id,
      sender_name: msg.sender.display_name,
      content: msg.type === "image" ? "Photo" : msg.content,
    });
  };

  const displayName = conversation?.other_user?.display_name ?? conversation?.name ?? "Conversation";
  const displayAvatar = conversation?.other_user?.avatar_url ?? conversation?.avatar_url;
  const otherUser = conversation?.other_user;
  const isGroup = conversation?.type === "group";
  const isOnline = otherOnline ?? otherUser?.is_online ?? false;

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <MessageSkeleton />
      </div>
    );
  }

  let lastDateLabel = "";

  const handleConversationUpdated = () => {
    api.get("/conversations/").then((r) => {
      const found = (r.data as Conversation[]).find((c: Conversation) => c.id === id);
      if (found) setConversation(found);
    }).catch(() => {});
  };

  return (
    <div className="flex h-full flex-col">

      {notifBanner && (
        <button
          onClick={() => router.push(`/chat/${notifBanner.convId}`)}
          className="flex items-center gap-3 bg-primary/10 border-b border-primary/20 px-4 py-2.5 text-left text-sm transition-colors hover:bg-primary/15"
        >
          <span className="shrink-0 text-xs font-bold text-primary">
            {notifBanner.sender}
          </span>
          <span className="truncate text-text-secondary">{notifBanner.content}</span>
        </button>
      )}

      {showEncryptionBanner && (
        <div className="flex items-center gap-2 bg-secondary/90 px-4 py-2 text-xs text-white/90">
          <span className="shrink-0">🔒</span>
          <p className="flex-1 leading-tight">
            Messages and calls are end-to-end encrypted. No one outside of this chat can read them.
          </p>
          <button
            onClick={() => setShowEncryptionBanner(false)}
            className="shrink-0 rounded p-0.5 text-white/50 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      <ChatHeader
        displayName={displayName}
        displayAvatar={displayAvatar ?? null}
        isGroup={isGroup}
        isOnline={isOnline}
        lastSeen={otherUser?.last_seen ?? null}
        memberCount={conversation?.member_count ?? 1}
        onBack={() => router.back()}
        onGroupInfo={() => setShowGroupInfo(true)}
        onLogout={() => { logout(); router.push("/login"); }}
        isMobile={isMobile}
        timerSeconds={conversation?.timer_seconds ?? null}
        onTimerChange={handleTimerChange}
      />

      {showGroupInfo && (
        <GroupInfoPanel
          conversationId={id}
          onClose={() => setShowGroupInfo(false)}
          onUpdated={handleConversationUpdated}
        />
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-2"
      >
        {loading && (
          <div className="py-4 flex justify-center">
            <div className="h-5 w-5 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-text-primary dark:text-text-invert">No messages yet</p>
            <p className="mt-1.5 text-xs text-text-secondary">Send a message to start the conversation</p>
          </div>
        )}

        {messages.map((msg) => {
          const dateLabel = getDateLabel(msg.created_at);
          const showDate = dateLabel !== lastDateLabel;
          lastDateLabel = dateLabel;

          return (
            <div key={msg.id} id={`msg-${msg.id}`}>
              {showDate && (
                <div className="flex justify-center py-2">
                  <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-3.5 py-1 text-[11px] font-semibold text-text-secondary">
                    {dateLabel}
                  </span>
                </div>
              )}
              <MessageBubble
                message={msg}
                isGroup={isGroup}
                onReplyClick={handleReplyClick}
                onReply={handleMessageClick}
              />
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <TypingIndicator names={typingNames} />

      <div className="relative px-4 pb-4">
        {/* Floating Action Button */}
        <div className="absolute -top-14 right-6 z-10">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:bg-[#E65A1E] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </button>
        </div>
        
        <MessageInput
          onSend={handleSend}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTypingStart={() => ws.sendTypingStart(id)}
          onTypingStop={() => ws.sendTypingStop(id)}
          disabled={false}
        />
      </div>
    </div>
  );
}

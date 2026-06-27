"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Pencil, Settings, MessageSquare } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Conversation } from "@/lib/types";
import { formatConversationTime, getInitials } from "@/lib/format";
import { toastError } from "@/lib/toast";
import SearchBar from "./SearchBar";
import NewChatModal from "./NewChatModal";

interface Props {
  activeId: string | null;
  onSelect: (id: string) => void;
  onCloseMobile: () => void;
}

export default function ConversationList({ activeId, onSelect, onCloseMobile }: Props) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/conversations/");
      setConversations(data);
    } catch {
      toastError("Failed to load conversations");
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const lastMessagePreview = (conv: Conversation): string => {
    const msg = conv.last_message;
    if (!msg) return "";
    if (msg.type === "image") return "📷 Photo";
    if (msg.type === "file") return "📎 File";
    if (msg.type === "system") return msg.content;
    return msg.content;
  };

  const displayName = (conv: Conversation): string => {
    if (conv.type === "group") return conv.name || "Group";
    return conv.other_user?.display_name || "Unknown";
  };

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between px-4">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-black">
                  {user ? getInitials(user.display_name) : "?"}
                </div>
              )}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="start"
              sideOffset={6}
              className="min-w-[160px] rounded-xl bg-sidebar p-1.5 shadow-xl outline-none"
            >
              <DropdownMenu.Item
                onClick={() => { router.push("/settings"); onCloseMobile(); }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Settings
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="mx-2 my-1 h-px bg-white/10" />
              <DropdownMenu.Item
                onClick={() => { logout(); router.push("/login"); }}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">Whispr</span>
        </div>

        <button
          onClick={() => setShowNewChat(true)}
          className="rounded-full p-2 text-foreground/60 transition-colors hover:bg-white/10 hover:text-foreground"
          aria-label="New chat"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
      </div>

      <SearchBar conversations={conversations} onSelect={onSelect} onCloseMobile={onCloseMobile} />

      <div className="flex-1 overflow-y-auto pb-16">
        {conversations.map((conv) => {
          const isActive = conv.id === activeId;
          const msg = conv.last_message;
          const isOwn = msg && msg.sender_id !== conv.other_user?.id;

          return (
            <button
              key={conv.id}
              onClick={() => {
                onSelect(conv.id);
                onCloseMobile();
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <div className="relative shrink-0">
                {conv.type === "direct" && conv.other_user?.avatar_url ? (
                  <img
                    src={conv.other_user.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-foreground/70">
                    {getInitials(displayName(conv))}
                  </div>
                )}
                {conv.type === "direct" && conv.other_user?.is_online && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-green-500" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="truncate text-sm font-medium text-foreground">
                    {displayName(conv)}
                  </span>
                  {msg && (
                    <span className="shrink-0 pl-2 text-[11px] text-foreground/40">
                      {formatConversationTime(msg.created_at)}
                    </span>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1">
                  {msg && isOwn && (
                    <span className="shrink-0 text-accent text-[11px]">✓✓</span>
                  )}
                  <span
                    className={`truncate text-sm ${
                      conv.unread_count > 0
                        ? "font-medium text-foreground"
                        : "text-foreground/50"
                    }`}
                  >
                    {lastMessagePreview(conv) || (
                      <span className="italic text-foreground/30">
                        {conv.type === "group" ? "Group created" : "No messages yet"}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {conv.unread_count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-black">
                  {conv.unread_count > 99 ? "99+" : conv.unread_count}
                </span>
              )}
            </button>
          );
        })}

        {conversations.length === 0 && (
          <div className="mt-24 flex flex-col items-center gap-3 px-8 text-center">
            <MessageSquare className="h-12 w-12 text-foreground/20" />
            <p className="text-sm text-foreground/40">
              No conversations yet. Tap the pencil to start a new chat.
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setShowNewChat(true)}
        className="fixed bottom-6 left-[300px] z-10 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-black shadow-lg transition-transform hover:scale-105 md:left-[292px]"
        aria-label="New chat"
      >
        <Pencil className="h-6 w-6" />
      </button>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={(id) => {
            setShowNewChat(false);
            onSelect(id);
            onCloseMobile();
            fetchConversations();
          }}
        />
      )}
    </>
  );
}

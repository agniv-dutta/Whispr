"use client";

import { useRef, useCallback, useState } from "react";
import { useAuthStore } from "@/lib/auth";
import type { ChatMessage } from "@/lib/types";
import { formatMessageTime, getMessageStatusIcon, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import ImageMessage from "./ImageMessage";
import FileMessage from "./FileMessage";
import ContactCard from "./ContactCard";
import { useLinkPreview, LinkPreviewCard } from "./LinkPreview";

interface Props {
  message: ChatMessage;
  isGroup: boolean;
  onReplyClick?: (messageId: string) => void;
  onReply?: (msg: ChatMessage) => void;
}

/** Warm-Energy double-tick / single-tick receipt icon */
function SentCheck({ status }: { status: "sent" | "delivered" | "read" | null }) {
  if (!status) return null;

  // "read" → coral primary; otherwise white/50
  const isRead = status === "read";

  return (
    <span className="inline-flex items-center">
      {status === "sent" ? (
        <svg
          width="16" height="11" viewBox="0 0 16 11" fill="none"
          className={isRead ? "text-success" : "text-white/60"}
        >
          <path
            d="M1 5.5L5 9.5L14.5 1"
            stroke="currentColor" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg
          width="21" height="11" viewBox="0 0 21 11" fill="none"
          className={isRead ? "text-success" : "text-white/60"}
        >
          <path d="M1 5.5L5 9.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5.5L14 9.5L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

/** Right-click / long-press context menu */
function ContextMenu({
  x, y, onReply, onClose,
}: {
  x: number; y: number;
  onReply: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="fixed z-50 min-w-[150px] rounded-xl bg-white dark:bg-surface-dark border border-neutral-200 dark:border-neutral-700 py-1 shadow-dark overflow-hidden"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => { onReply(); onClose(); }}
          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] font-medium text-text-primary dark:text-text-invert transition-colors hover:bg-primary/8"
        >
          <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Reply
        </button>
      </div>
    </>
  );
}

export default function MessageBubble({ message, isGroup, onReplyClick, onReply }: Props) {
  const { user }     = useAuthStore();
  const isOwn        = user?.id === message.sender.id;
  const [swiping, setSwiping]       = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef(0);
  const { preview: linkPreviewData } = useLinkPreview(!isOwn && message.content ? message.content : "");

  /* ── System message ──────────────────────── */
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-3">
        <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-6 py-2 text-[13px] italic font-medium text-text-secondary">
          {message.content}
        </span>
      </div>
    );
  }

  /* ── Deleted message ─────────────────────── */
  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-1`}>
        <div className={cn("max-w-[70%]", isGroup && !isOwn ? "ml-10" : "")}>
          <div className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 px-5 py-2.5 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <p className="text-[13px] italic font-medium text-text-secondary">This message was deleted</p>
          </div>
        </div>
      </div>
    );
  }

  const statusIcon = getMessageStatusIcon(message.statuses, user?.id ?? null);

  /* ── Swipe handlers ──────────────────────── */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartRef.current;
    if (dx > 0 && dx < 120) setSwiping(dx);
    else if (dx >= 120) setSwiping(120);
    else setSwiping(0);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swiping >= 80 && onReply) onReply(message);
    setSwiping(0);
  }, [swiping, onReply, message]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-0.5`}>
      <div className={cn("max-w-[68%]", isGroup && !isOwn ? "ml-10" : "")}>

        {/* Group sender label + avatar */}
        {isGroup && !isOwn && (
          <div className="mb-0.5 flex items-center gap-2 pl-1">
            <ContactCard
              userId={message.sender.id}
              displayName={message.sender.display_name}
              avatarUrl={message.sender.avatar_url}
              bio={message.sender.bio}
              isOnline={message.sender.is_online}
              lastSeen={message.sender.last_seen}
            >
              {message.sender.avatar_url ? (
                <img
                  src={message.sender.avatar_url}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                  {getInitials(message.sender.display_name)}
                </span>
              )}
            </ContactCard>
            <ContactCard
              userId={message.sender.id}
              displayName={message.sender.display_name}
              avatarUrl={message.sender.avatar_url}
              bio={message.sender.bio}
              isOnline={message.sender.is_online}
              lastSeen={message.sender.last_seen}
            >
              <span className="text-[11px] font-semibold text-primary">
                {message.sender.display_name}
              </span>
            </ContactCard>
          </div>
        )}

        {/* Bubble */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleContextMenu}
          onClick={() => onReply?.(message)}
          style={swiping > 0 ? { transform: `translateX(${swiping}px)`, transition: "none" } : undefined}
          className={cn(
            "relative rounded-2xl px-3.5 py-2 cursor-pointer",
            "transition-transform duration-150",
            isOwn
              ? "bg-primary text-white rounded-br-[4px]"
              : "bg-neutral-100 dark:bg-neutral-800 text-white rounded-bl-[4px]"
          )}
        >
          {/* Swipe-to-reply indicator */}
          {swiping > 0 && !contextMenu && (
            <div
              className="absolute left-0 top-0 flex h-full items-center rounded-l-2xl bg-primary/15 pl-2"
              style={{ width: `${swiping}px`, opacity: Math.min(swiping / 80, 1) }}
            >
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          )}

          {/* Reply preview */}
          {message.reply_to && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplyClick?.(message.reply_to!.id); }}
              className={cn(
                "mb-1.5 flex cursor-pointer flex-col border-l-2 pl-2 pr-3 pt-1 pb-1.5 text-left transition-opacity hover:opacity-80 rounded-r-lg",
                isOwn
                  ? "border-white/50 bg-white/10"
                  : "border-primary bg-primary/8"
              )}
            >
              <span className={cn("text-[11px] font-semibold", isOwn ? "text-white/90" : "text-primary")}>
                {message.reply_to.sender_name}
              </span>
              <span className={cn("line-clamp-1 text-[12px]", isOwn ? "text-white/70" : "text-white/70")}>
                {message.reply_to.type === "image" ? "📷 Photo" : message.reply_to.content}
              </span>
            </button>
          )}

          {/* Image attachment */}
          {message.type === "image" && message.attachment && (
            <div className="mb-1.5">
              <ImageMessage url={message.attachment.url} alt={message.content || "Image"} />
            </div>
          )}

          {/* File attachment */}
          {message.type === "file" && message.attachment && (
            <div className="mb-1.5">
              <FileMessage
                url={message.attachment.url}
                fileType={message.attachment.file_type}
                fileSize={message.attachment.file_size}
                fileName={message.attachment.file_name}
              />
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-[14px] leading-snug whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Link preview */}
          {linkPreviewData && !isOwn && (
            <LinkPreviewCard preview={linkPreviewData} />
          )}

          {/* Time + read receipt */}
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <span className={cn(
              "text-[10px] leading-none",
              isOwn ? "text-white/60" : "text-white/60"
            )}>
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && <SentCheck status={statusIcon} />}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onReply={() => onReply?.(message)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

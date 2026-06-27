"use client";

import { useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { ChatMessage } from "@/lib/types";
import { formatMessageTime, getMessageStatusIcon, getInitials } from "@/lib/format";
import ImageMessage from "./ImageMessage";
import FileMessage from "./FileMessage";

interface Props {
  message: ChatMessage;
  isGroup: boolean;
  onReplyClick?: (messageId: string) => void;
  onReply?: (msg: ChatMessage) => void;
}

function SentCheck({ status }: { status: "sent" | "delivered" | "read" | null }) {
  if (!status) return null;
  const color = status === "read" ? "var(--status-teal)" : "var(--status-gray)";
  return (
    <span className="inline-flex items-center" style={{ color }}>
      {status === "sent" ? (
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 5.5L5 9.5L14.5 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="21" height="11" viewBox="0 0 21 11" fill="none">
          <path d="M1 5.5L5 9.5L11 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5.5L14 9.5L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function ContextMenu({
  x,
  y,
  onReply,
  onClose,
}: {
  x: number;
  y: number;
  onReply: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 min-w-[140px] rounded-xl bg-sidebar py-1 shadow-xl"
        style={{ left: x, top: y }}
      >
        <button
          onClick={() => { onReply(); onClose(); }}
          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/5"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Reply
        </button>
      </div>
    </>
  );
}

export default function MessageBubble({ message, isGroup, onReplyClick, onReply }: Props) {
  const { user } = useAuth();
  const isOwn = user?.id === message.sender.id;
  const [swiping, setSwiping] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef(0);

  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-white/5 px-4 py-1 text-[11px] text-foreground/40">
          {message.content}
        </span>
      </div>
    );
  }

  if (message.is_deleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-0.5`}>
        <div
          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
            isOwn ? "bg-received-bubble" : "bg-received-bubble"
          }`}
        >
          <p className="text-sm italic text-foreground/40">This message was deleted</p>
        </div>
      </div>
    );
  }

  const statusIcon = getMessageStatusIcon(message.statuses, user?.id ?? null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartRef.current;
    if (dx > 0 && dx < 120) {
      setSwiping(dx);
    } else if (dx >= 120) {
      setSwiping(120);
    } else {
      setSwiping(0);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (swiping >= 80 && onReply) {
      onReply(message);
    }
    setSwiping(0);
  }, [swiping, onReply, message]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-0.5`}>
      <div className={`max-w-[70%] ${isGroup && !isOwn ? "ml-10" : ""}`}>
        {isGroup && !isOwn && (
          <div className="mb-0.5 flex items-center gap-2 pl-1">
            {message.sender.avatar_url ? (
              <img src={message.sender.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sidebar text-[9px] font-semibold text-foreground/60">
                {getInitials(message.sender.display_name)}
              </span>
            )}
            <span className="text-[11px] font-medium text-accent">
              {message.sender.display_name}
            </span>
          </div>
        )}

        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={handleContextMenu}
          onClick={() => onReply?.(message)}
          className={`relative rounded-2xl px-3 py-2 cursor-pointer transition-transform ${
            isOwn
              ? "bg-sent-bubble text-black rounded-br-md"
              : "bg-received-bubble text-foreground rounded-bl-md"
          }`}
          style={swiping > 0 ? { transform: `translateX(${swiping}px)`, transition: "none" } : undefined}
        >
          {swiping > 0 && !contextMenu && (
            <div
              className="absolute left-0 top-0 flex h-full items-center rounded-l-2xl bg-accent/20 pl-2"
              style={{ width: `${swiping}px`, opacity: Math.min(swiping / 80, 1) }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          )}

          {message.reply_to && (
            <button
              onClick={(e) => { e.stopPropagation(); onReplyClick?.(message.reply_to!.id); }}
              className="mb-1.5 flex cursor-pointer flex-col border-l-2 border-accent bg-white/5 pl-2 pr-3 pt-1 pb-1.5 text-left transition-opacity hover:opacity-80 rounded-r-lg"
            >
              <span className="text-[11px] font-semibold text-accent">
                {message.reply_to.sender_name}
              </span>
              <span className="line-clamp-1 text-[12px] text-foreground/60">
                {message.reply_to.type === "image" ? "📷 Photo" : message.reply_to.content}
              </span>
            </button>
          )}

          {message.type === "image" && message.attachment && (
            <div className="mb-1.5">
              <ImageMessage url={message.attachment.url} alt={message.content || "Image"} />
            </div>
          )}

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

          {message.content && (
            <p className="text-[14.5px] leading-snug whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          <div className="mt-0.5 flex items-center justify-end gap-1">
            <span
              className={`text-[10px] leading-none ${
                isOwn ? "text-black/45" : "text-foreground/40"
              }`}
            >
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && <SentCheck status={statusIcon} />}
          </div>
        </div>
      </div>

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

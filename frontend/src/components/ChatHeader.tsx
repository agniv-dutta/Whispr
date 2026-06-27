"use client";

import { useState } from "react";
import { ArrowLeft, LogOut, Phone, Video, Clock } from "lucide-react";
import { getInitials, formatLastActive } from "@/lib/format";

const DISAPPEARING_OPTIONS = [
  { label: "Off", value: null },
  { label: "30 seconds", value: 30 },
  { label: "5 minutes", value: 300 },
  { label: "1 hour", value: 3600 },
  { label: "1 day", value: 86400 },
  { label: "1 week", value: 604800 },
];

function formatDurationLabel(seconds: number | null): string | null {
  if (seconds === null) return null;
  const opt = DISAPPEARING_OPTIONS.find((o) => o.value === seconds);
  if (opt) return opt.label;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
}

interface Props {
  displayName: string;
  displayAvatar: string | null;
  isGroup: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  memberCount: number;
  onBack: () => void;
  onGroupInfo?: () => void;
  onLogout: () => void;
  isMobile: boolean;
  timerSeconds: number | null;
  onTimerChange?: (seconds: number | null) => void;
}

function DisappearingSheet({
  current,
  onSelect,
  onClose,
}: {
  current: number | null;
  onSelect: (v: number | null) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-2xl bg-background p-5 shadow-2xl">
        <div className="mb-1 text-center text-sm font-semibold text-foreground">
          Disappearing Messages
        </div>
        <p className="mb-4 text-center text-xs text-foreground/40">
          Messages will be deleted after the selected duration
        </p>
        <div className="space-y-1">
          {DISAPPEARING_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { onSelect(opt.value); onClose(); }}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors ${
                current === opt.value
                  ? "bg-accent/20 text-accent font-semibold"
                  : "text-foreground hover:bg-white/5"
              }`}
            >
              <span>{opt.label}</span>
              {current === opt.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ChatHeader({
  displayName,
  displayAvatar,
  isGroup,
  isOnline,
  lastSeen,
  memberCount,
  onBack,
  onGroupInfo,
  onLogout,
  isMobile,
  timerSeconds,
  onTimerChange,
}: Props) {
  const [showTimerSheet, setShowTimerSheet] = useState(false);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-white/5 bg-background px-4">
      {isMobile && (
        <button
          onClick={onBack}
          className="text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      <button
        onClick={isGroup ? onGroupInfo : undefined}
        className={`flex items-center gap-3 min-w-0 flex-1 ${isGroup ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="relative shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-foreground/60">
              {getInitials(displayName)}
            </span>
          )}
          {!isGroup && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              }`}
            />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </h2>
          <div className="flex items-center gap-2">
            {timerSeconds !== null && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-accent">
                <Clock className="h-3 w-3" />
                {formatDurationLabel(timerSeconds)}
              </span>
            )}
            <p className="truncate text-[11px] text-foreground/40">
              {isGroup
                ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                : isOnline
                  ? "online"
                  : `last seen ${formatLastActive(lastSeen)}`}
            </p>
          </div>
        </div>
      </button>

      <button
        onClick={() => setShowTimerSheet(true)}
        className={`rounded-full p-2 transition-colors ${
          timerSeconds !== null
            ? "text-accent hover:text-accent/80"
            : "text-foreground/40 hover:text-foreground"
        }`}
        title="Disappearing messages"
      >
        <Clock className="h-4 w-4" />
      </button>

      {!isGroup && (
        <div className="flex items-center gap-1">
          <button className="rounded-full p-2 text-foreground/40 transition-colors hover:text-foreground">
            <Phone className="h-4 w-4" />
          </button>
          <button className="rounded-full p-2 text-foreground/40 transition-colors hover:text-foreground">
            <Video className="h-4 w-4" />
          </button>
        </div>
      )}

      <button
        onClick={onLogout}
        className="rounded-full p-2 text-foreground/40 transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>

      {showTimerSheet && (
        <DisappearingSheet
          current={timerSeconds}
          onSelect={(v) => onTimerChange?.(v)}
          onClose={() => setShowTimerSheet(false)}
        />
      )}
    </header>
  );
}

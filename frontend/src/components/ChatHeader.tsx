"use client";

import { useState } from "react";
import { ArrowLeft, LogOut, Phone, Video, Clock } from "lucide-react";
import { getInitials, formatLastActive } from "@/lib/format";
import { cn } from "@/lib/utils";

const DISAPPEARING_OPTIONS = [
  { label: "Off",        value: null },
  { label: "30 seconds", value: 30 },
  { label: "5 minutes",  value: 300 },
  { label: "1 hour",     value: 3600 },
  { label: "1 day",      value: 86400 },
  { label: "1 week",     value: 604800 },
];

function formatDurationLabel(seconds: number | null): string | null {
  if (seconds === null) return null;
  const opt = DISAPPEARING_OPTIONS.find((o) => o.value === seconds);
  if (opt) return opt.label;
  if (seconds < 60)      return `${seconds}s`;
  if (seconds < 3600)    return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400)   return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800)  return `${Math.floor(seconds / 86400)}d`;
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
  current, onSelect, onClose,
}: {
  current: number | null;
  onSelect: (v: number | null) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white dark:bg-surface-dark p-5 shadow-2xl border-t border-neutral-200 dark:border-neutral-700">
        <div className="mb-1 text-center text-sm font-bold text-text-primary dark:text-text-invert">
          Disappearing Messages
        </div>
        <p className="mb-5 text-center text-xs text-text-secondary">
          Messages will be deleted after the selected duration
        </p>
        <div className="space-y-1">
          {DISAPPEARING_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              onClick={() => { onSelect(opt.value); onClose(); }}
              className={cn(
                "flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors",
                current === opt.value
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-text-primary dark:text-text-invert hover:bg-neutral-100 dark:hover:bg-neutral-800"
              )}
            >
              <span>{opt.label}</span>
              {current === opt.value && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
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
  displayName, displayAvatar, isGroup, isOnline, lastSeen,
  memberCount, onBack, onGroupInfo, onLogout, isMobile,
  timerSeconds, onTimerChange,
}: Props) {
  const [showTimerSheet, setShowTimerSheet] = useState(false);

  return (
    <header className="flex h-16 items-center gap-3 border-b border-neutral-200 dark:border-neutral-800 bg-surface-light dark:bg-surface-dark px-4 shrink-0">
      {/* Back (mobile) */}
      {isMobile && (
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-text-secondary hover:text-primary hover:bg-primary/8 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}

      {/* Avatar + name row */}
      <button
        onClick={isGroup ? onGroupInfo : undefined}
        className={cn(
          "flex items-center gap-3 min-w-0 flex-1",
          isGroup ? "cursor-pointer" : "cursor-default"
        )}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          {displayAvatar ? (
            <img
              src={displayAvatar}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#E65A1E] text-sm font-bold text-white">
              {getInitials(displayName)}
            </span>
          )}
          {/* Online dot */}
          {!isGroup && (
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2",
                "border-surface-light dark:border-surface-dark",
                isOnline ? "bg-success" : "bg-neutral-400"
              )}
            />
          )}
        </div>

        {/* Name + status */}
        <div className="min-w-0">
          <h2 className="truncate text-[13.5px] font-bold text-text-primary dark:text-text-invert">
            {displayName}
          </h2>
          <div className="flex items-center gap-2">
            {timerSeconds !== null && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-semibold">
                <Clock className="h-2.5 w-2.5" />
                {formatDurationLabel(timerSeconds)}
              </span>
            )}
            <p className="truncate text-[11px] text-text-secondary">
              {isGroup
                ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                : isOnline
                  ? <span className="text-success font-medium">Online</span>
                  : `last seen ${formatLastActive(lastSeen)}`
              }
            </p>
          </div>
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5">
        {/* Disappearing timer */}
        <button
          onClick={() => setShowTimerSheet(true)}
          title="Disappearing messages"
          className={cn(
            "rounded-full p-2 transition-colors",
            timerSeconds !== null
              ? "text-primary hover:bg-primary/8"
              : "text-text-secondary hover:text-primary hover:bg-primary/8"
          )}
        >
          <Clock className="h-4 w-4" />
        </button>

        {/* Voice/Video call (DM only) */}
        {!isGroup && (
          <>
            <button className="rounded-full p-2 text-text-secondary hover:text-primary hover:bg-primary/8 transition-colors">
              <Phone className="h-4 w-4" />
            </button>
            <button className="rounded-full p-2 text-text-secondary hover:text-primary hover:bg-primary/8 transition-colors">
              <Video className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="rounded-full p-2 text-text-secondary hover:text-error hover:bg-error/8 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Disappearing messages sheet */}
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

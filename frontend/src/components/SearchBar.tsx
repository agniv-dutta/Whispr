"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";
import api from "@/lib/api";
import type { Conversation, UserPublic } from "@/lib/types";
import { getInitials, formatLastActive } from "@/lib/format";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onCloseMobile: () => void;
}

export default function SearchBar({ conversations, onSelect, onCloseMobile }: Props) {
  const [query, setQuery]       = useState("");
  const [people, setPeople]     = useState<UserPublic[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const localResults = query.trim()
    ? conversations.filter((c) => {
        const name = c.type === "group"
          ? c.name || ""
          : c.other_user?.display_name || "";
        return name.toLowerCase().includes(query.toLowerCase());
      })
    : [];

  useEffect(() => {
    if (!query.trim()) {
      setPeople([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/users/search", {
          params: { q: query },
        });
        const convUserIds = new Set(
          conversations
            .filter((c) => c.type === "direct")
            .map((c) => c.other_user?.id)
            .filter(Boolean),
        );
        setPeople(data.filter((u: UserPublic) => !convUserIds.has(u.id)));
      } catch {
        setPeople([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, conversations]);

  const handleStartConversation = async (userId: string) => {
    try {
      const { data } = await api.post("/conversations/", {
        type: "direct",
        member_ids: [userId],
      });
      onSelect(data.id);
      onCloseMobile();
      setQuery("");
    } catch {
      toastError("Failed to create conversation");
    }
  };

  return (
    <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800/60">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or start new chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "w-full rounded-xl bg-neutral-100 dark:bg-neutral-800",
            "py-2.5 pl-10 pr-4 text-[13px]",
            "text-text-primary dark:text-text-invert",
            "placeholder:text-text-secondary",
            "outline-none",
            "focus:ring-2 focus:ring-primary/25 focus:bg-white dark:focus:bg-neutral-700",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Dropdown results */}
      {query.trim() && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-white dark:bg-surface-dark border border-neutral-200 dark:border-neutral-700 shadow-dark">
          {/* Existing conversations */}
          {localResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                Conversations
              </div>
              {localResults.map((c) => {
                const cName = c.type === "group" ? c.name || "G" : c.other_user?.display_name || "?";
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelect(c.id);
                      onCloseMobile();
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-text-primary dark:text-text-invert transition-colors hover:bg-primary/5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#E65A1E] text-xs font-bold text-white">
                      {getInitials(cName)}
                    </span>
                    <span className="truncate font-medium">{cName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* New people */}
          {people.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">
                <Plus className="h-3 w-3" />
                Start new chat
              </div>
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStartConversation(p.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-text-primary dark:text-text-invert transition-colors hover:bg-primary/5"
                >
                  <div className="relative shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20 text-secondary text-xs font-bold">
                        {getInitials(p.display_name)}
                      </span>
                    )}
                    {p.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-surface-dark bg-success" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{p.display_name}</div>
                    <div className="text-[11px] text-text-secondary">
                      {p.is_online
                        ? <span className="text-success font-medium">Online</span>
                        : formatLastActive(p.last_seen)
                      }
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {localResults.length === 0 && people.length === 0 && !searching && (
            <div className="px-3 py-8 text-center text-xs text-text-secondary">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {searching && (
            <div className="px-3 py-5 text-center">
              <div className="inline-block h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus } from "lucide-react";
import api from "@/lib/api";
import type { Conversation, UserPublic } from "@/lib/types";
import { getInitials, formatLastActive } from "@/lib/format";
import { toastError } from "@/lib/toast";

interface Props {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onCloseMobile: () => void;
}

export default function SearchBar({ conversations, onSelect, onCloseMobile }: Props) {
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<UserPublic[]>([]);
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
        setPeople(
          data.filter((u: UserPublic) => !convUserIds.has(u.id)),
        );
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
    <div className="border-b border-white/5 px-4 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search or start new chat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl bg-sidebar py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-foreground/30"
        />
      </div>

      {query.trim() && (
        <div className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-sidebar">
          {localResults.length > 0 && (
            <div>
              <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                Conversations
              </div>
              {localResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelect(c.id);
                    onCloseMobile();
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground/60">
                    {getInitials(c.type === "group" ? c.name || "G" : c.other_user?.display_name || "?")}
                  </div>
                  <span className="truncate">
                    {c.type === "group" ? c.name : c.other_user?.display_name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {people.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                <Plus className="h-3 w-3" />
                People
              </div>
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleStartConversation(p.id)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-white/5"
                >
                  <div className="relative shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-xs font-semibold text-foreground/60">
                        {getInitials(p.display_name)}
                      </div>
                    )}
                    {p.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-green-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{p.display_name}</div>
                    <div className="text-xs text-foreground/40">
                      {p.is_online ? "Online" : formatLastActive(p.last_seen)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {localResults.length === 0 && people.length === 0 && !searching && (
            <div className="px-3 py-6 text-center text-xs text-foreground/30">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {searching && (
            <div className="px-3 py-4 text-center text-xs text-foreground/30">
              Searching...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

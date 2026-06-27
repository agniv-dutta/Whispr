"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Plus, Users } from "lucide-react";
import api from "@/lib/api";
import type { UserPublic } from "@/lib/types";
import { getInitials } from "@/lib/format";
import { toastError } from "@/lib/toast";

interface Props {
  onClose: () => void;
  onConversationCreated: (id: string) => void;
}

export default function NewChatModal({ onClose, onConversationCreated }: Props) {
  const [tab, setTab] = useState<"message" | "group">("message");
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedUsers, setSelectedUsers] = useState<UserPublic[]>([]);
  const [groupName, setGroupName] = useState("");

  const open = true;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get("/users/search", {
          params: { q: searchQuery },
        });
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = async (user: UserPublic) => {
    if (tab === "message") {
      setLoading(true);
      try {
        const { data } = await api.post("/conversations/", {
          type: "direct",
          member_ids: [user.id],
        });
        onConversationCreated(data.id);
      } catch {
        toastError("Failed to create conversation");
      }
      setLoading(false);
    } else {
      if (!selectedUsers.find((u) => u.id === user.id)) {
        setSelectedUsers([...selectedUsers, user]);
      }
      setSearchQuery("");
    }
  };

  const removeSelected = (id: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== id));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    try {
      const { data } = await api.post("/conversations/", {
        type: "group",
        name: groupName.trim(),
        member_ids: selectedUsers.map((u) => u.id),
      });
      onConversationCreated(data.id);
    } catch {
      toastError("Failed to create group");
    }
    setLoading(false);
  };

  const filtered = results.filter(
    (u) => !selectedUsers.find((s) => s.id === u.id),
  );

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 data-[state=open]:animate-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-background p-0 outline-none">
          <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              New {tab === "message" ? "Message" : "Group"}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-full p-1 text-foreground/40 transition-colors hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex border-b border-white/5">
            <button
              onClick={() => setTab("message")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "message"
                  ? "border-b-2 border-accent text-accent"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              New Message
            </button>
            <button
              onClick={() => setTab("group")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === "group"
                  ? "border-b-2 border-accent text-accent"
                  : "text-foreground/50 hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              New Group
            </button>
          </div>

          {tab === "group" && (
            <div className="px-5 py-3">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full rounded-xl bg-sidebar px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-foreground/30"
              />

              {selectedUsers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <span
                      key={u.id}
                      className="flex items-center gap-1.5 rounded-full bg-sidebar pl-1.5 pr-2.5 py-1 text-xs text-foreground"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-semibold">
                        {getInitials(u.display_name)}
                      </span>
                      {u.display_name}
                      <button
                        onClick={() => removeSelected(u.id)}
                        className="ml-0.5 text-foreground/40 hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="px-5 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
              <input
                type="text"
                placeholder={
                  tab === "message"
                    ? "Search contacts..."
                    : "Add members..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-sidebar py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-foreground/30"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto px-2 pb-4">
            {searching && (
              <div className="px-3 py-4 text-center text-xs text-foreground/30">
                Searching...
              </div>
            )}

            {!searching && filtered.length === 0 && searchQuery.trim() && (
              <div className="px-3 py-4 text-center text-xs text-foreground/30">
                No users found
              </div>
            )}

            {filtered.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                disabled={loading}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                <div className="relative shrink-0">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-foreground/60">
                      {getInitials(user.display_name)}
                    </div>
                  )}
                  {user.is_online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {user.display_name}
                  </div>
                  {user.bio && (
                    <div className="truncate text-xs text-foreground/40">
                      {user.bio}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {tab === "group" && (
            <div className="border-t border-white/5 px-5 py-4">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
                className="w-full rounded-xl bg-accent py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? "Creating..." : `Create Group (${selectedUsers.length} members)`}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

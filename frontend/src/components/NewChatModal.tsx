"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, Plus, Users, Camera } from "lucide-react";
import api from "@/lib/api";
import type { UserPublic } from "@/lib/types";
import { getInitials } from "@/lib/format";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/lib/analytics";

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

  const { trackConversationCreated } = useAnalytics();
  const [selectedUsers, setSelectedUsers] = useState<UserPublic[]>([]);
  const [groupName, setGroupName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        trackConversationCreated();
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
      // Optionally we'd upload an avatar here using the file input if we implemented form data
      trackConversationCreated();
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
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in z-[60]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[24px] bg-surface-light dark:bg-surface-dark p-0 outline-none shadow-dark z-[70] overflow-hidden flex flex-col max-h-[90vh]">
          
          <div className="flex flex-col shrink-0">
            <div className="flex items-center justify-between px-6 py-5">
              <Dialog.Title className="text-[18px] font-bold text-text-primary dark:text-text-invert">
                {tab === "message" ? "New Message" : "Create Group"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="rounded-full p-2 text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6 gap-6">
              <button
                onClick={() => setTab("message")}
                className={cn(
                  "flex items-center gap-2 pb-3 text-[14px] font-bold transition-colors relative",
                  tab === "message" ? "text-primary" : "text-text-secondary hover:text-text-primary dark:hover:text-text-invert"
                )}
              >
                <Plus className="h-4 w-4" />
                Direct
                {tab === "message" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
              </button>
              <button
                onClick={() => setTab("group")}
                className={cn(
                  "flex items-center gap-2 pb-3 text-[14px] font-bold transition-colors relative",
                  tab === "group" ? "text-primary" : "text-text-secondary hover:text-text-primary dark:hover:text-text-invert"
                )}
              >
                <Users className="h-4 w-4" />
                Group
                {tab === "group" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
            {tab === "group" && (
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 h-[72px] w-[72px] rounded-full border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
                >
                  <Camera className="h-6 w-6" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />

                <div className="flex-1 flex flex-col justify-center">
                  <label className="text-[12px] font-bold text-text-secondary mb-1">Group Name</label>
                  <input
                    type="text"
                    placeholder="Enter group name..."
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2.5 text-[14px] font-semibold text-text-primary dark:text-text-invert outline-none border border-transparent focus:border-primary/50 transition-colors placeholder:text-text-secondary/60"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="text-[12px] font-bold text-text-secondary mb-1 block">
                {tab === "group" ? "Add Members" : "Search Contacts"}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 py-2.5 pl-9 pr-4 text-[14px] font-medium text-text-primary dark:text-text-invert outline-none border border-transparent focus:border-primary/50 transition-colors placeholder:text-text-secondary/60"
                />
              </div>
            </div>

            {tab === "group" && selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-full bg-primary/10 pl-1.5 pr-2.5 py-1.5 text-[12px] font-bold text-primary border border-primary/20"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-surface-dark text-[9px] font-bold">
                        {getInitials(u.display_name)}
                      </span>
                    )}
                    {u.display_name}
                    <button
                      onClick={() => removeSelected(u.id)}
                      className="ml-1 text-primary/60 hover:text-primary transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto -mx-2 px-2 min-h-[200px]">
              {searching && (
                <div className="py-8 flex justify-center">
                  <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              )}

              {!searching && filtered.length === 0 && searchQuery.trim() && (
                <div className="py-8 text-center text-[13px] text-text-secondary font-medium">
                  No users found matching "{searchQuery}"
                </div>
              )}

              {filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  disabled={loading}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                >
                  <div className="relative shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                        {getInitials(user.display_name)}
                      </div>
                    )}
                    {user.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-light dark:border-surface-dark bg-success" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-bold text-text-primary dark:text-text-invert truncate">
                      {user.display_name}
                    </div>
                    {user.bio && (
                      <div className="truncate text-[12px] text-text-secondary mt-0.5">
                        {user.bio}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {tab === "group" && (
            <div className="px-6 py-5 shrink-0 flex flex-col items-center border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0 || loading}
                className={cn(
                  "w-full py-3.5 rounded-[12px] font-bold text-white text-[15px]",
                  "bg-primary hover:bg-[#E65A1E] active:bg-[#D94E12]",
                  "shadow-lg shadow-primary/20",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none mb-3"
                )}
              >
                {loading ? "Creating..." : "Create Group"}
              </button>
              <p className="text-[11px] text-text-secondary font-medium">
                Members will be notified once the group is created.
              </p>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

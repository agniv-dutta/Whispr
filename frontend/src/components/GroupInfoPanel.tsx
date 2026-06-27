"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Plus, Trash2, LogOut, Search, Shield } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ConversationDetail, UserPublic } from "@/lib/types";
import { getInitials, formatLastActive } from "@/lib/format";
import { toastSuccess, toastError } from "@/lib/toast";

interface Props {
  conversationId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function GroupInfoPanel({ conversationId, onClose, onUpdated }: Props) {
  const { user: currentUser } = useAuth();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = detail?.members.some(
    (m) => m.user_id === currentUser?.id && m.role === "admin"
  );

  const fetchDetail = async () => {
    try {
      const { data } = await api.get(`/conversations/${conversationId}`);
      setDetail(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchDetail(); }, [conversationId]);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/users/search", { params: { q: searchQuery } });
        const existingIds = new Set(detail?.members.map((m) => m.user_id) ?? []);
        setSearchResults(data.filter((u: UserPublic) => !existingIds.has(u.id)));
      } catch { setSearchResults([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, detail]);

  const handleSaveName = async () => {
    if (!nameInput.trim() || !isAdmin) return;
    setSaving(true);
    try {
      await api.put(`/conversations/${conversationId}`, { name: nameInput.trim() });
      setEditingName(false);
      fetchDetail();
      onUpdated();
    } catch {
      toastError("Failed to update name");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    const form = new FormData();
    form.append("avatar", file);
    try {
      await api.put(`/conversations/${conversationId}`, form);
      fetchDetail();
      onUpdated();
    } catch {
      toastError("Failed to update avatar");
    }
  };

  const handleAddMembers = async (userId: string) => {
    try {
      await api.post(`/conversations/${conversationId}/members`, { member_ids: [userId] });
      setSearchQuery("");
      setSearchResults([]);
      setShowAddMembers(false);
      fetchDetail();
      onUpdated();
      toastSuccess("Member added");
    } catch {
      toastError("Failed to add member");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await api.delete(`/conversations/${conversationId}/members/${userId}`);
      setConfirmRemove(null);
      fetchDetail();
      onUpdated();
      toastSuccess("Member removed");
    } catch {
      toastError("Failed to remove member");
    }
  };

  const handleExitGroup = async () => {
    if (!currentUser) return;
    try {
      await api.delete(`/conversations/${conversationId}/members/${currentUser.id}`);
      onClose();
    } catch {
      toastError("Failed to leave group");
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentUser) return;
    try {
      await api.delete(`/conversations/${conversationId}/members/${currentUser.id}`);
      onClose();
    } catch {
      toastError("Failed to delete group");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-center p-8 text-sm text-foreground/30">Loading...</div>
      </div>
    );
  }

  if (!detail) return null;

  const groupAvatar = detail.avatar_url;
  const groupName = detail.name || "Group";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-background shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
        <h2 className="text-base font-semibold text-foreground">Group Info</h2>
        <button onClick={onClose} className="rounded-full p-1 text-foreground/40 hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center py-6">
          <div className="relative">
            {groupAvatar ? (
              <img src={groupAvatar} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sidebar text-xl font-semibold text-foreground/60">
                {getInitials(groupName)}
              </span>
            )}
            {isAdmin && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100"
              >
                <Camera className="h-6 w-6 text-white" />
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {editingName && isAdmin ? (
            <div className="mt-3 flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="rounded-lg bg-sidebar px-3 py-1.5 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <button
                onClick={handleSaveName}
                disabled={saving || !nameInput.trim()}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <h3
                className={`text-base font-semibold text-foreground ${isAdmin ? "cursor-pointer hover:text-accent" : ""}`}
                onClick={() => { if (isAdmin) { setNameInput(groupName); setEditingName(true); } }}
              >
                {groupName}
              </h3>
              {isAdmin && <span className="text-[10px] text-foreground/30">(tap to edit)</span>}
            </div>
          )}

          <p className="mt-1 text-xs text-foreground/40">{detail.member_count} members</p>
        </div>

        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground/40">Members</span>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-accent transition-colors hover:bg-white/5"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            )}
          </div>

          {showAddMembers && (
            <div className="mt-2 rounded-xl bg-sidebar p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/30" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full rounded-lg bg-background py-2 pl-8 pr-3 text-xs text-foreground outline-none placeholder:text-foreground/30"
                  autoFocus
                />
              </div>
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleAddMembers(u.id)}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-foreground transition-colors hover:bg-white/5"
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-[9px] font-semibold text-foreground/60">
                      {getInitials(u.display_name)}
                    </span>
                  )}
                  {u.display_name}
                </button>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="py-2 text-center text-xs text-foreground/30">No users found</p>
              )}
            </div>
          )}

          <div className="mt-2 space-y-0.5">
            {detail.members.map((m) => {
              const isSelf = m.user_id === currentUser?.id;
              return (
                <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/[0.02]">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar text-xs font-semibold text-foreground/60">
                      {getInitials(m.display_name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {m.display_name}
                      </span>
                      {m.role === "admin" && (
                        <span className="flex items-center gap-0.5 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">
                          <Shield className="h-2.5 w-2.5" />
                          admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground/40">
                      {m.is_online ? "online" : `last seen ${formatLastActive(m.last_seen)}`}
                    </p>
                  </div>
                  {!isSelf && isAdmin && (
                    <div className="relative">
                      {confirmRemove === m.user_id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="rounded-lg bg-red-500/20 px-2 py-1 text-[10px] text-red-400"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="rounded-lg px-1 py-1 text-[10px] text-foreground/40"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(m.user_id)}
                          className="rounded-full p-1.5 text-foreground/30 transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-white/5 px-4 py-4 space-y-2">
          <button
            onClick={handleExitGroup}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-white/5"
          >
            <LogOut className="h-4 w-4" />
            Exit Group
          </button>
          {isAdmin && (
            <button
              onClick={handleDeleteGroup}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

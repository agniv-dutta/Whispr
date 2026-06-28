"use client";

import { useState, useEffect, useRef } from "react";
import { X, Camera, Plus, Trash2, LogOut, Search, Shield, Info, Bell } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import type { ConversationDetail, UserPublic } from "@/lib/types";
import { getInitials, formatLastActive } from "@/lib/format";
import { toastSuccess, toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface Props {
  conversationId: string;
  onClose: () => void;
  onUpdated: () => void;
}

export default function GroupInfoPanel({ conversationId, onClose, onUpdated }: Props) {
  const { user: currentUser } = useAuthStore();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [muted, setMuted] = useState(false);
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

  if (loading) {
    return (
      <div className="flex-shrink-0 w-[320px] border-l border-neutral-200 dark:border-neutral-800 bg-surface-light dark:bg-surface-dark flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-center h-full">
          <div className="h-6 w-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const groupAvatar = detail.avatar_url;
  const groupName = detail.name || "Group";
  const createdBy = detail.members.find(m => m.role === "admin")?.display_name || "Admin";

  return (
    <div className="flex-shrink-0 w-[320px] border-l border-neutral-200 dark:border-neutral-800 bg-surface-light dark:bg-surface-dark flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-bold text-text-primary dark:text-text-invert truncate">Group Info</h2>
          <p className="text-[12px] text-text-secondary truncate mt-0.5">Created by {createdBy} on Jan 12, 2024</p>
        </div>
        <button onClick={onClose} className="shrink-0 p-2 -mr-2 rounded-full text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        
        {/* Avatar & Name Edit */}
        <div className="flex flex-col items-center py-6 px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="relative group cursor-pointer mb-4">
            {groupAvatar ? (
              <img src={groupAvatar} alt="" className="h-24 w-24 rounded-full object-cover shadow-sm border border-neutral-200 dark:border-neutral-700" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary shadow-sm border border-neutral-200 dark:border-neutral-700">
                {getInitials(groupName)}
              </span>
            )}
            {isAdmin && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-6 w-6 text-white" />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {editingName && isAdmin ? (
            <div className="flex flex-col w-full gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-[14px] font-semibold text-text-primary dark:text-text-invert outline-none border border-transparent focus:border-primary/50 transition-colors text-center"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingName(false)}
                  className="flex-1 rounded-xl bg-neutral-200 dark:bg-neutral-700 px-3 py-2 text-[13px] font-semibold text-text-primary dark:text-text-invert"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={saving || !nameInput.trim()}
                  className="flex-1 rounded-xl bg-primary px-3 py-2 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h3
                className={cn("text-[20px] font-bold text-text-primary dark:text-text-invert text-center", isAdmin && "cursor-pointer hover:text-primary transition-colors")}
                onClick={() => { if (isAdmin) { setNameInput(groupName); setEditingName(true); } }}
              >
                {groupName}
              </h3>
              {isAdmin && <p className="text-[11px] text-text-secondary mt-1">Tap to edit group name</p>}
            </div>
          )}
        </div>

        {/* Shared Media */}
        <div className="py-5 px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[14px] font-bold text-text-primary dark:text-text-invert">Shared Media</h4>
            <button className="text-[12px] font-semibold text-primary hover:text-[#E65A1E] transition-colors">
              View All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden">
               <img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Media" />
            </div>
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden">
               <img src="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Media" />
            </div>
            <div className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-lg overflow-hidden flex items-center justify-center relative">
               <img src="https://images.unsplash.com/photo-1628126235206-5260b9ea6441?q=80&w=200&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Media" />
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="text-white text-[12px] font-bold">+12</span>
               </div>
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="py-5 px-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[14px] font-bold text-text-primary dark:text-text-invert">Members ({detail.member_count})</h4>
            {isAdmin && (
              <button
                onClick={() => setShowAddMembers(!showAddMembers)}
                className="p-1 rounded-full text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}
          </div>

          {showAddMembers && (
            <div className="mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 border border-neutral-200 dark:border-neutral-700">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users to add..."
                  className="w-full bg-surface-light dark:bg-surface-dark border border-neutral-200 dark:border-neutral-700 rounded-lg py-2 pl-9 pr-3 text-[13px] text-text-primary dark:text-text-invert outline-none focus:border-primary transition-colors"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleAddMembers(u.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {getInitials(u.display_name)}
                      </span>
                    )}
                    <span className="text-[13px] font-semibold text-text-primary dark:text-text-invert">{u.display_name}</span>
                  </button>
                ))}
                {searchQuery && searchResults.length === 0 && (
                  <p className="py-2 text-center text-[12px] text-text-secondary">No users found</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {detail.members.map((m) => {
              const isSelf = m.user_id === currentUser?.id;
              return (
                <div key={m.id} className="flex items-center gap-3 group">
                  <div className="relative">
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                        {getInitials(m.display_name)}
                      </span>
                    )}
                    {m.is_online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-light dark:border-surface-dark bg-success" />
                    )}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-text-primary dark:text-text-invert truncate">
                        {m.display_name} {isSelf && "(You)"}
                      </span>
                      {m.role === "admin" && (
                        <span className="text-[10px] font-semibold text-error">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">
                      {m.is_online ? <span className="text-success font-medium">Online</span> : `Last seen ${formatLastActive(m.last_seen)}`}
                    </p>
                  </div>
                  
                  {!isSelf && isAdmin && (
                    <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                      {confirmRemove === m.user_id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            className="rounded px-2 py-1 bg-error/10 text-error text-[11px] font-bold hover:bg-error/20"
                          >
                            Remove
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="rounded px-2 py-1 text-text-secondary text-[11px] font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(m.user_id)}
                          className="p-1.5 rounded-full text-text-secondary hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Toggles & Actions */}
        <div className="py-4 px-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-text-secondary" />
              <span className="text-[14px] font-semibold text-text-primary dark:text-text-invert">Mute Notifications</span>
            </div>
            {/* Custom Toggle Switch */}
            <button 
              onClick={() => setMuted(!muted)}
              className={cn("w-10 h-6 rounded-full flex items-center transition-colors p-1", muted ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700")}
            >
              <div className={cn("bg-white h-4 w-4 rounded-full shadow-sm transition-transform duration-200", muted ? "translate-x-4" : "translate-x-0")} />
            </button>
          </div>

          <button
            onClick={handleExitGroup}
            className="flex w-full items-center gap-3 text-[14px] font-semibold text-error hover:text-red-500 transition-colors py-2"
          >
            <LogOut className="h-5 w-5" />
            Leave Group
          </button>
        </div>
      </div>
    </div>
  );
}

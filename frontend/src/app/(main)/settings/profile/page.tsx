"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Phone } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toastError } from "@/lib/toast";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      setUser(data);
      if (avatarFile) {
        const form = new FormData();
        form.append("avatar", avatarFile);
        const { data: avatarData } = await api.put("/users/me/avatar", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setUser(avatarData);
      }
      router.back();
    } catch {
      toastError("Failed to save profile");
    }
    setSaving(false);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <button onClick={() => router.back()} className="text-foreground/60 hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex flex-col items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative h-24 w-24"
          >
            {avatarPreview || user?.avatar_url ? (
              <img
                src={avatarPreview || user?.avatar_url || ""}
                alt=""
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sidebar text-2xl font-semibold text-foreground/60">
                {(user?.display_name ?? "U").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          <p className="mt-2 text-xs text-foreground/40">Tap to change photo</p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-xl bg-sidebar px-4 py-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent placeholder:text-foreground/30"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl bg-sidebar px-4 py-3 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent placeholder:text-foreground/30"
              placeholder="About yourself..."
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
              Phone
            </label>
            <div className="flex items-center gap-3 rounded-xl bg-sidebar px-4 py-3">
              <Phone className="h-4 w-4 text-foreground/30" />
              <span className="text-sm text-foreground/60">{user?.phone ?? "Not set"}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!displayName.trim() || saving}
          className="mt-8 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

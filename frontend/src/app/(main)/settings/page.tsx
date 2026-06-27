"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Bell, Shield, Moon, Monitor, Smartphone, Phone, HelpCircle, ChevronRight, Camera } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toastError } from "@/lib/toast";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put("/users/me", {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      setUser(data);
      setEditing(false);
    } catch {
      toastError("Failed to save profile");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    try {
      const { data } = await api.put("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data);
    } catch {
      toastError("Failed to upload avatar");
    }
  };

  const currentTheme = resolvedTheme ?? "dark";

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="mt-6 first:mt-0">
      <p className="mb-1 px-4 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
        {label}
      </p>
      <div className="bg-sidebar">{children}</div>
    </div>
  );

  const Row = ({
    icon,
    label,
    sub,
    onClick,
    right,
  }: {
    icon: React.ReactNode;
    label: string;
    sub?: string;
    onClick?: () => void;
    right?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-50"
      disabled={!onClick}
    >
      <span className="shrink-0 text-foreground/40">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-foreground">{label}</div>
        {sub && <div className="text-[11px] text-foreground/40">{sub}</div>}
      </div>
      {right || (onClick && <ChevronRight className="h-4 w-4 shrink-0 text-foreground/20" />)}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
        <button onClick={() => router.back()} className="text-foreground/60 hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto py-4">
        <Section label="Profile">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative h-16 w-16 shrink-0"
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-background text-lg font-semibold text-foreground/60">
                  {(user?.display_name ?? "U").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-2">
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
                  />
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio (optional)"
                    className="w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none ring-1 ring-white/10 focus:ring-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={saving || !displayName.trim()}
                      className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditing(false); setDisplayName(user?.display_name ?? ""); setBio(user?.bio ?? ""); }}
                      className="rounded-lg px-3 py-1.5 text-xs text-foreground/40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="w-full text-left">
                  <div className="text-sm font-medium text-foreground">
                    {user?.display_name || "Your name"}
                  </div>
                  {user?.bio && <div className="text-xs text-foreground/40 mt-0.5">{user.bio}</div>}
                  <div className="mt-1 text-[11px] text-accent">Edit profile</div>
                </button>
              )}
            </div>
          </div>
          <Row
            icon={<Shield className="h-5 w-5" />}
            label="Phone"
            sub={user?.phone ?? ""}
          />
        </Section>

        <Section label="Privacy">
          <Row icon={<Shield className="h-5 w-5" />} label="Privacy settings" sub="Last seen, profile photo, about" />
        </Section>

        <Section label="Notifications">
          <Row icon={<Bell className="h-5 w-5" />} label="Notification settings" sub="Message, group & call notifications" />
        </Section>

        <Section label="Appearance">
          <Row
            icon={currentTheme === "dark" ? <Moon className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
            label="Theme"
            sub={currentTheme === "dark" ? "Dark" : "Light"}
            onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
            right={
              <button
                onClick={(e) => { e.stopPropagation(); setTheme(currentTheme === "dark" ? "light" : "dark"); }}
                className={`relative h-6 w-10 rounded-full transition-colors ${currentTheme === "dark" ? "bg-accent" : "bg-white/20"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${currentTheme === "dark" ? "translate-x-[18px]" : "translate-x-0.5"}`}
                />
              </button>
            }
          />
        </Section>

        <Section label="Devices">
          <Row
            icon={<Smartphone className="h-5 w-5" />}
            label="Linked devices"
            sub="Coming soon"
          />
        </Section>

        <Section label="Calls">
          <Row icon={<Phone className="h-5 w-5" />} label="Call settings" sub="Configure call preferences" />
        </Section>

        <Section label="Help">
          <Row icon={<HelpCircle className="h-5 w-5" />} label="Help" sub="FAQ, contact support" />
        </Section>

        <div className="px-4 py-6">
          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="w-full rounded-xl bg-red-500/10 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

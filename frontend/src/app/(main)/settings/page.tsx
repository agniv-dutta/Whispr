"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, HelpCircle, Lock, EyeOff, Bell, Vibrate, Palette, ChevronRight, PenLine, BarChart3 } from "lucide-react";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/auth";
import { toastError } from "@/lib/toast";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const currentTheme = resolvedTheme ?? "light";

  const SectionTitle = ({ label }: { label: string }) => (
    <h3 className="mt-8 mb-3 px-1 text-[11px] font-bold tracking-widest text-primary uppercase">
      {label}
    </h3>
  );

  const Row = ({
    icon,
    title,
    subtitle,
    right,
    onClick
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    right?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-4 py-4 rounded-xl transition-colors",
        onClick ? "cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50" : ""
      )}
    >
      <div className="shrink-0 text-text-secondary">{icon}</div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[15px] font-bold text-text-primary dark:text-text-invert">{title}</h4>
        <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>
      </div>
      {right && <div className="shrink-0 ml-2">{right}</div>}
    </div>
  );

  const CustomToggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
      onClick={onChange}
      className={cn("w-[42px] h-6 rounded-full flex items-center transition-colors px-0.5", checked ? "bg-primary" : "bg-neutral-200 dark:bg-neutral-700")}
    >
      <div className={cn("bg-white h-[20px] w-[20px] rounded-full shadow-sm transition-transform duration-200", checked ? "translate-x-[18px]" : "translate-x-0")} />
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 shrink-0">
        <h1 className="text-[20px] font-bold text-primary">Settings</h1>
        <div className="flex items-center gap-4">
          <button className="text-text-secondary hover:text-text-primary transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-text-secondary hover:text-text-primary transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-12">
        {/* Profile Card */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-[24px] p-8 flex flex-col items-center mt-4 shadow-sm border border-neutral-100 dark:border-neutral-800">
          <div className="relative mb-4">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover shadow-md" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary shadow-md">
                {(user?.display_name ?? "U").charAt(0).toUpperCase()}
              </div>
            )}
            <button className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-surface-light dark:border-surface-dark hover:bg-[#E65A1E] transition-colors">
              <PenLine className="h-4 w-4" />
            </button>
          </div>
          
          <h2 className="text-[22px] font-bold text-text-primary dark:text-text-invert">
            {user?.display_name || "Your name"}
          </h2>
          <p className="text-[14px] text-text-secondary mt-1">
            @{(user?.display_name || "").toLowerCase().replace(/\s+/g, '_')}_24
          </p>

          <button className="mt-6 px-6 py-2 rounded-xl border border-primary text-[14px] font-bold text-primary hover:bg-primary/5 transition-colors">
            Edit Public Profile
          </button>
        </div>

        {/* Settings Sections */}
        <div className="mt-4">
          <SectionTitle label="Privacy & Security" />
          <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-sm border border-neutral-100 dark:border-neutral-800 p-1">
            <Row 
              icon={<Lock className="h-5 w-5" />}
              title="End-to-End Encryption"
              subtitle="Manage your unique encryption keys"
              right={<ChevronRight className="h-5 w-5 text-text-secondary" />}
              onClick={() => {}}
            />
            <Row 
              icon={<EyeOff className="h-5 w-5" />}
              title="Read Receipts"
              subtitle="Others can see when you've read messages"
              right={<CustomToggle checked={true} onChange={() => {}} />}
            />
          </div>

          <SectionTitle label="Notifications" />
          <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-sm border border-neutral-100 dark:border-neutral-800 p-1">
            <Row 
              icon={<Bell className="h-5 w-5" />}
              title="Desktop Notifications"
              subtitle="Receive alerts while app is in background"
              right={<CustomToggle checked={true} onChange={() => {}} />}
            />
            <Row 
              icon={<Vibrate className="h-5 w-5" />}
              title="Sound & Haptics"
              subtitle="Play sounds for incoming messages"
              right={<CustomToggle checked={false} onChange={() => {}} />}
            />
          </div>

          <SectionTitle label="Appearance" />
          <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-sm border border-neutral-100 dark:border-neutral-800 p-1">
            <Row 
              icon={<Palette className="h-5 w-5" />}
              title="Theme Mode"
              subtitle="Switch between light and dark modes"
              right={
                <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                  <button 
                    onClick={() => setTheme("light")}
                    className={cn(
                      "px-4 py-1.5 text-[12px] font-bold rounded-md transition-colors",
                      currentTheme === "light" ? "bg-surface-light text-text-primary shadow-sm" : "text-text-secondary"
                    )}
                  >
                    Light
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "px-4 py-1.5 text-[12px] font-bold rounded-md transition-colors",
                      currentTheme === "dark" ? "bg-surface-dark text-text-invert shadow-sm" : "text-text-secondary"
                    )}
                  >
                    Dark
                  </button>
                </div>
              }
            />
          </div>

          <SectionTitle label="Insights" />
          <div className="bg-surface-light dark:bg-surface-dark rounded-[16px] shadow-sm border border-neutral-100 dark:border-neutral-800 p-1">
            <Row 
              icon={<BarChart3 className="h-5 w-5" />}
              title="Analytics"
              subtitle="Messages sent, activity, storage & more"
              right={<ChevronRight className="h-5 w-5 text-text-secondary" />}
              onClick={() => router.push('/settings/analytics')}
            />
          </div>
          
          <div className="mt-8 px-1">
             <button
              onClick={() => { logout(); router.push("/login"); }}
              className="w-full rounded-xl bg-error/10 py-3.5 text-[14px] font-bold text-error transition-colors hover:bg-error/20"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

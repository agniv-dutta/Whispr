'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';
import apiClient from '@/lib/api';
import type { Conversation } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import ConversationList from '@/components/ConversationList';
import SearchBar from '@/components/SearchBar';

/**
 * Main shell layout – 3-panel structure:
 *
 * ┌──────────┬────────────────┬──────────────────────────┐
 * │  Sidebar │  Convs panel  │  children (chat pane)    │
 * │  260px   │    320px       │        flex-1            │
 * └──────────┴────────────────┴──────────────────────────┘
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  const token   = useAuthStore((s) => s.token);
  const router  = useRouter();
  const [mounted, setMounted]         = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!token) router.push('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    apiClient.get('/conversations')
      .then((r) => setConversations(r.data))
      .catch(() => {});
  }, [token]);

  const handleSelect = useCallback((id: string) => {
    router.push(`/chat/${id}`);
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark overflow-hidden">
      {/* ── 1. Nav sidebar (brand + icons) ───── */}
      <Sidebar />

      {/* ── 2. Conversation list panel ────────── */}
      <div className="w-[320px] shrink-0 flex flex-col bg-surface-light dark:bg-surface-dark border-r border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <SearchBar
          conversations={conversations}
          onSelect={handleSelect}
          onCloseMobile={() => {}}
        />
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>
      </div>

      {/* ── 3. Main content area ──────────────── */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        {children}
      </div>
    </div>
  );
}

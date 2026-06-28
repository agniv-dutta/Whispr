'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '@/lib/api';
import { cn } from '@/lib/utils';
import { getInitials, formatConversationTime } from '@/lib/format';
import type { Conversation } from '@/lib/types';

export default function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const router   = useRouter();
  const pathname = usePathname() ?? '';

  const fetchConversations = useCallback(async () => {
    try {
      const res = await apiClient.get('/conversations');
      setConversations(res.data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-2.5 w-48 rounded bg-neutral-100 dark:bg-neutral-800/60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg className="h-7 w-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-text-primary dark:text-text-invert">No conversations yet</p>
        <p className="text-xs text-text-secondary mt-1">
          Tap <span className="text-primary font-medium">+ New Message</span> to start a chat.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
      {conversations.map((conv: Conversation) => {
        const name      = conv.type === 'group' ? conv.name : conv.other_user?.display_name;
        const initials  = getInitials(name ?? 'U');
        const isActive  = pathname === `/chat/${conv.id}`;
        const hasUnread = (conv.unread_count ?? 0) > 0;

        return (
          <button
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
              isActive
                ? 'bg-primary/8 dark:bg-primary/10'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              {conv.avatar_url || conv.other_user?.avatar_url ? (
                <img
                  src={(conv.avatar_url || conv.other_user?.avatar_url)!}
                  alt={name ?? ''}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <span className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white',
                  'bg-gradient-to-br from-primary to-[#E65A1E]'
                )}>
                  {initials}
                </span>
              )}
              {/* Online indicator */}
              {conv.type === 'direct' && conv.other_user?.is_online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface-light dark:border-surface-dark bg-success" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  'text-[13.5px] font-semibold truncate',
                  isActive
                    ? 'text-primary'
                    : 'text-text-primary dark:text-text-invert'
                )}>
                  {name}
                </p>
                {conv.last_message?.created_at && (
                  <span className={cn(
                    'text-[11px] shrink-0',
                    hasUnread ? 'text-primary font-semibold' : 'text-text-secondary'
                  )}>
                    {formatConversationTime(conv.last_message.created_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <p className="text-xs text-text-secondary truncate leading-snug">
                  {conv.last_message?.content || 'No messages yet'}
                </p>
                {hasUnread && (
                  <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

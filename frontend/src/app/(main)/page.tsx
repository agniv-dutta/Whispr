'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface Conversation {
  id: string;
  name?: string;
  type: string;
  other_user?: { id: string; display_name: string; is_online: boolean };
  last_message?: { content: string; created_at: string };
  unread_count?: number;
}

export default function ChatListPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchConvs = async () => {
      try {
        const res = await fetch(`${API_URL}/conversations/`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.status === 401) {
          useAuthStore.getState().logout();
          router.push('/login');
          return;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        console.log('Conversations:', data.length);
        setConversations(data);
      } catch (err: any) {
        console.error('Failed to load conversations:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConvs();
  }, [token, router]);

  return (
    <div className="w-96 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Whispr</h1>
      </div>

      {/* Search */}
      <div className="p-3">
        <input
          type="text"
          placeholder="Search or start new chat"
          className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="space-y-2 p-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 bg-gray-800 rounded" />
                  <div className="h-2 w-1/2 bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-orange-400 text-sm hover:underline">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && conversations.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-gray-400 text-sm">No conversations yet</p>
            <p className="text-gray-500 text-xs mt-1">Start a new chat to begin messaging</p>
          </div>
        )}

        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800/50 cursor-pointer transition border-b border-gray-800/50"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-white font-semibold shrink-0">
              {(conv.name || conv.other_user?.display_name || '?').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {conv.name || conv.other_user?.display_name || 'Unknown'}
              </p>
              <p className="text-gray-400 text-xs truncate mt-0.5">
                {conv.last_message?.content || 'No messages yet'}
              </p>
            </div>
            {conv.unread_count ? (
              <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {conv.unread_count}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

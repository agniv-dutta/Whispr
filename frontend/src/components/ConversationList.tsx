'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/api';
import { ConversationSkeleton } from './Skeletons';
import { NoConversations } from './EmptyState';

interface Conversation {
  id: string;
  name?: string;
  type: string;
  other_user?: {
    id: string;
    display_name: string;
    is_online: boolean;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  avatar_url?: string | null;
  unread_count?: number;
}

export default function ConversationList() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await apiClient.get('/conversations');
        setConversations(res.data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  if (loading) {
    return (
      <div className="py-2">
        {Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)}
      </div>
    );
  }

  if (conversations.length === 0) {
    return <NoConversations />;
  }

  return (
    <div className="divide-y divide-[#2c3e50]">
      <AnimatePresence>
        {conversations.map((conv) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => router.push(`/chat/${conv.id}`)}
            className="p-3 hover:bg-[#2c3e50] cursor-pointer transition"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 shrink-0">
                <div className="w-full h-full rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-lg">
                  {conv.other_user?.display_name?.[0]?.toUpperCase() || conv.name?.[0]?.toUpperCase() || '?'}
                </div>
                {conv.other_user?.is_online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111b21] bg-green-500">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white truncate">
                    {conv.name || conv.other_user?.display_name}
                  </p>
                  {conv.last_message?.created_at && (
                    <p className="text-xs text-gray-500 shrink-0 ml-2">
                      {new Date(conv.last_message.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate mt-0.5">
                  {conv.last_message?.content || 'No messages yet'}
                </p>
              </div>
              {(conv.unread_count ?? 0) > 0 && (
                <span className="shrink-0 flex items-center justify-center h-5 min-w-[20px] rounded-full bg-[#00a884] px-1.5 text-xs font-bold text-black">
                  {conv.unread_count}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

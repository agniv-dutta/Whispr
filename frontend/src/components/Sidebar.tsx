'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { Pencil, Search as SearchIcon } from 'lucide-react';
import NewChatModal from './NewChatModal';
import { useKeyboard } from '@/hooks/useKeyboard';

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => { setIsMobile(window.innerWidth < 768); }, []);

  useKeyboard({
    'Cmd+n': () => setShowNewChat(true),
    'Ctrl+n': () => setShowNewChat(true),
    'Escape': () => { setShowNewChat(false); },
  });

  const activeChat = pathname.startsWith('/chat/') ? pathname.split('/chat/')[1] : null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <div className="w-[360px] bg-[#111b21] border-r border-[#2c3e50] flex flex-col shrink-0">
        <div className="p-4 border-b border-[#2c3e50]">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Whispr</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChat(true)}
                className="rounded-full p-2 text-gray-400 hover:bg-[#2c3e50] hover:text-white transition-colors"
                title="New conversation (Ctrl+N)"
              >
                <Pencil className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded hover:bg-[#2c3e50]"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="p-3 border-b border-[#2c3e50]">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search or start new chat (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#2c3e50] text-white rounded-lg placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00a884] text-sm"
            />
            {searchQuery && (
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#00a884] hover:underline"
              >
                Search
              </button>
            )}
          </div>
        </form>

        <div className="flex-1 overflow-y-auto">
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onConversationCreated={(convId) => {
            setShowNewChat(false);
            router.push(`/chat/${convId}`);
          }}
        />
      )}
    </>
  );
}

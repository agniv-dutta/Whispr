'use client';

import { useAuthStore } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Users,
  Phone,
  Settings,
  Plus,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/',          icon: MessageCircle, label: 'Chats' },
  { href: '/contacts',  icon: Users,         label: 'Contacts' },
  { href: '/calls',     icon: Phone,         label: 'Calls' },
  { href: '/settings',  icon: Settings,      label: 'Settings' },
];

export default function Sidebar() {
  const user    = useAuthStore((s) => s.user);
  const logout  = useAuthStore((s) => s.logout);
  const router  = useRouter();
  const pathname = usePathname() ?? '/';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside className="w-[260px] bg-surface-light dark:bg-surface-dark border-r border-neutral-200 dark:border-neutral-800 flex flex-col h-full shrink-0">
      {/* ── Brand Header ─────────────────────────── */}
      <div className="px-6 pt-7 pb-5">
        <h1 className="text-[22px] font-black tracking-tight text-primary leading-none">
          Whispr
        </h1>
        <p className="text-[11px] font-medium text-text-secondary mt-0.5 tracking-wide">
          Secure Messaging
        </p>
      </div>

      {/* ── Navigation ───────────────────────────── */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-150 group',
                active
                  ? 'bg-primary/10 text-primary border-l-[3px] border-primary rounded-l-none'
                  : 'text-text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-text-primary dark:hover:text-text-invert border-l-[3px] border-transparent rounded-l-none'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active ? 'text-primary' : 'text-text-secondary group-hover:text-primary'
                )}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── User Info ────────────────────────────── */}
      {user && (
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="h-8 w-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
              {user.display_name?.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary dark:text-text-invert truncate">
              {user.display_name}
            </p>
            <p className="text-[11px] text-text-secondary truncate">
              {user.phone || user.username}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-text-secondary hover:text-error transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── New Message CTA ──────────────────────── */}
      <div className="px-4 pb-6 pt-2">
        <button
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-[#E65A1E] active:bg-[#D94E12] transition-all duration-200 shadow-md shadow-primary/30"
        >
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>
    </aside>
  );
}

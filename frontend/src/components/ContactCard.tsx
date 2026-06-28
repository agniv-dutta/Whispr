'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  userId: string;
  displayName: string;
  phone?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
  children: React.ReactNode;
}

export default function ContactCard({
  displayName,
  phone,
  bio,
  avatarUrl,
  isOnline,
  lastSeen,
  children,
}: Props) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-[#2c3e50] bg-[#111b21] p-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#00a884]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
                {isOnline && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#111b21] bg-green-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{displayName}</p>
                {phone && <p className="text-xs text-gray-400">{phone}</p>}
                {bio && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{bio}</p>}
                {lastSeen && !isOnline && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    Last seen {new Date(lastSeen).toLocaleString()}
                  </p>
                )}
                {isOnline && <p className="mt-1 text-[11px] text-green-400">Online</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

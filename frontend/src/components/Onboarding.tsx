'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const SEEN_KEY = 'whispr-onboarding-seen';

export default function Onboarding() {
  const router = useRouter();
  const [frame, setFrame] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(SEEN_KEY)) {
      router.replace('/');
      return;
    }

    const t1 = setTimeout(() => setFrame(1), 600);
    const t2 = setTimeout(() => setFrame(2), 1400);
    const t3 = setTimeout(() => setFrame(3), 2600);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [router]);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, '1');
    setExiting(true);
    setTimeout(() => router.replace('/login'), 400);
  };

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b141a]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <rect width="80" height="80" rx="20" fill="#00a884" />
              <path d="M25 55V30l30 12.5L25 55z" fill="#0b141a" />
            </svg>
          </motion.div>

          <motion.h1
            className="mt-6 text-4xl font-bold text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Whispr
          </motion.h1>

          {frame >= 1 && (
            <motion.p
              className="mt-2 text-gray-400 text-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              Secure messaging
            </motion.p>
          )}

          {frame >= 2 && (
            <motion.div
              className="mt-10 flex gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <button
                onClick={() => { localStorage.setItem(SEEN_KEY, '1'); router.push('/login'); }}
                className="rounded-xl bg-[#00a884] px-8 py-3 font-semibold text-black hover:opacity-90"
              >
                Login
              </button>
              <button
                onClick={() => { localStorage.setItem(SEEN_KEY, '1'); router.push('/register'); }}
                className="rounded-xl border border-[#2c3e50] px-8 py-3 font-semibold text-white hover:bg-[#2c3e50]"
              >
                Register
              </button>
            </motion.div>
          )}

          {frame >= 2 && (
            <motion.p
              className="absolute bottom-8 text-xs text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button onClick={dismiss} className="hover:text-gray-400">Skip →</button>
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

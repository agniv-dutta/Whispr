'use client';

import { useRef, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth';

export function useSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pref = useRef(false);

  const play = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/message.mp3');
      }
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } catch {}
  }, []);

  return { play };
}

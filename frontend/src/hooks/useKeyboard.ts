'use client';

import { useEffect } from 'react';

export function useKeyboard(handlers: Record<string, () => void>) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.metaKey ? 'Cmd+' : '',
        e.ctrlKey ? 'Ctrl+' : '',
        e.key,
      ].join('');

      if (handlers[key]) {
        e.preventDefault();
        handlers[key]();
      }

      if (e.key === 'Escape' && handlers['Escape']) {
        e.preventDefault();
        handlers['Escape']();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

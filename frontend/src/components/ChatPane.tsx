'use client';

import { cn } from '@/lib/utils';

/**
 * ChatPane – shown when no conversation is selected.
 * Renders the coral-themed empty state placeholder.
 */
export default function ChatPane() {
  return (
    <div className={cn(
      'flex-1 flex flex-col items-center justify-center',
      'bg-bg-light dark:bg-bg-dark',
      'select-none'
    )}>
      {/* Icon */}
      <div className="mb-6 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
        <svg
          className="h-10 w-10 text-primary"
          viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={1.4}
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Heading */}
      <h2 className="text-[22px] font-black text-text-primary dark:text-text-invert tracking-tight mb-2">
        Whispr
      </h2>
      <p className="text-sm text-text-secondary max-w-[240px] text-center leading-relaxed">
        Select a conversation from the left to start messaging
      </p>

      {/* Subtle pill badges */}
      <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-xs">
        {['End-to-end encrypted', 'Fast & reliable', 'Cross-device'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-medium text-text-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

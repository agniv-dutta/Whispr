import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // Base layout
        'w-full px-4 py-2.5 rounded-lg border-2 text-sm',
        'transition-all duration-200',
        // Colors
        'bg-surface-light dark:bg-surface-dark',
        'text-text-primary dark:text-text-invert',
        'placeholder:text-text-secondary',
        // Default border
        'border-neutral-200 dark:border-neutral-800',
        // Focus ring – coral
        'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
        // Error state
        error && 'border-error focus:border-error focus:ring-error/20',
        // Disabled
        'disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:text-text-secondary disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };

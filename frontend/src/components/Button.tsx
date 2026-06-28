import React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-[#E65A1E] active:bg-[#D94E12] focus-visible:ring-primary/40 shadow-sm shadow-primary/20',
  secondary:
    'bg-transparent border-2 border-secondary text-secondary hover:bg-secondary/5 active:bg-secondary/10 focus-visible:ring-secondary/40',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible:ring-neutral-400/40',
  danger:
    'bg-error text-white hover:bg-red-600 active:bg-red-700 focus-visible:ring-red-500/40 shadow-sm shadow-error/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        // Base
        'inline-flex items-center justify-center rounded-lg font-semibold',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };

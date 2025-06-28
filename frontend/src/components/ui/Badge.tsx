import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const variants = {
      default: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200',
      primary: 'bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-300',
      secondary: 'bg-secondary-100 dark:bg-secondary-800 text-secondary-800 dark:text-secondary-200',
      success: 'bg-success-100 dark:bg-success-900/50 text-success-800 dark:text-success-300',
      warning: 'bg-warning-100 dark:bg-warning-900/50 text-warning-800 dark:text-warning-300',
      error: 'bg-error-100 dark:bg-error-900/50 text-error-800 dark:text-error-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
      lg: 'px-3 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium theme-transition',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full h-10 rounded-lg bg-background border border-border px-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    className={cn('block text-sm font-medium text-foreground mb-2', className)}
    {...props}
  />
);

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 rounded-lg bg-surface border border-border px-3 text-sm text-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/25 cursor-pointer',
        className
      )}
      {...props}
    />
  )
);
Select.displayName = 'Select';

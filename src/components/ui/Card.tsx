import type { HTMLAttributes } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article' | 'aside';
  padded?: boolean;
}

export function Card({ as: Tag = 'div', padded = true, className, ...rest }: CardProps) {
  return (
    <Tag
      className={cn('rounded-[var(--radius-card)] bg-surface shadow-soft', padded && 'p-5 sm:p-6', className)}
      {...rest}
    />
  );
}

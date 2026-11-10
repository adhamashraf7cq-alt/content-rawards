import { cn } from '@/lib/utils';

type BadgeVariant = 'purple' | 'blue' | 'green' | 'yellow' | 'red' | 'gray';

const variants: Record<BadgeVariant, string> = {
  purple: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
  blue:   'bg-blue-500/15 text-blue-300 border-blue-500/25',
  green:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
  red:    'bg-red-500/15 text-red-300 border-red-500/25',
  gray:   'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

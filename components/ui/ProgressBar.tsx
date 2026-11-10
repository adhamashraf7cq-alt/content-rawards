import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
  color?: 'purple' | 'blue' | 'green';
}

const colorMap = {
  purple: 'from-violet-600 to-violet-400',
  blue:   'from-blue-600 to-blue-400',
  green:  'from-emerald-600 to-emerald-400',
};

export function ProgressBar({
  value,
  className,
  showLabel = false,
  animated = true,
  color = 'purple',
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full bg-gradient-to-r rounded-full transition-all duration-500',
            colorMap[color],
            animated && clamped < 100 && 'shimmer',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-zinc-500 text-right">{clamped}%</p>
      )}
    </div>
  );
}

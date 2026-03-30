import { cn } from '@/lib/utils/format';

export function BentoPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'glass-surface rounded-2xl border border-ui-subtle p-4 shadow-sm sm:p-5 dark:border-white/10',
        className
      )}
    >
      {children}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils/format';

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

export function ResponsiveGrid({ 
  children, 
  className = "",
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-12',
  };

  const gridColsClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };

  const mobileCols = cols.mobile || 1;
  const tabletCols = cols.tablet || 2;
  const desktopCols = cols.desktop || 3;

  return (
    <div className={cn(
      'grid',
      gridColsClasses[mobileCols as keyof typeof gridColsClasses],
      `sm:${gridColsClasses[tabletCols as keyof typeof gridColsClasses]}`,
      `lg:${gridColsClasses[desktopCols as keyof typeof gridColsClasses]}`,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

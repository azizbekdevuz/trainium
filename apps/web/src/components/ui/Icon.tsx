'use client';

import { Icons, IconName } from '@/lib/icons';
import { cn } from '../../lib/format';

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
}

export function Icon({ name, className, size = 16 }: IconProps) {
  const IconComponent = Icons[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  return (
    <IconComponent 
      className={cn("inline-block", className)} 
      size={size}
    />
  );
}

// Size variants for common use cases
export const IconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const;

// Predefined icon components for common use cases
export function CelebrationIcon({ className, size = IconSizes.lg }: { className?: string; size?: number }) {
  return <Icon name="celebration" className={className} size={size} />;
}

export function PackageIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="package" className={className} size={size} />;
}

export function MoneyIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="money" className={className} size={size} />;
}

export function UsersIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="users" className={className} size={size} />;
}

export function ShoppingIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="shopping" className={className} size={size} />;
}

export function WarningIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="warning" className={className} size={size} />;
}

export function SuccessIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="success" className={className} size={size} />;
}

export function ErrorIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="error" className={className} size={size} />;
}

export function ArrowRightIcon({ className, size = IconSizes.sm }: { className?: string; size?: number }) {
  return <Icon name="arrowRight" className={className} size={size} />;
}

export function ArrowLeftIcon({ className, size = IconSizes.sm }: { className?: string; size?: number }) {
  return <Icon name="arrowLeft" className={className} size={size} />;
}

export function SunIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="sun" className={className} size={size} />;
}

export function MoonIcon({ className, size = IconSizes.md }: { className?: string; size?: number }) {
  return <Icon name="moon" className={className} size={size} />;
}

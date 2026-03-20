import { cn } from "@/lib/utils/format";
import { GlassPanel } from "./GlassPanel";

interface GlassCardProps {
  variant?: "surface" | "elevated" | "accent";
  radius?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClass = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function GlassCard({
  variant = "surface",
  radius = "lg",
  className,
  children,
  padding = "md",
}: GlassCardProps) {
  return (
    <GlassPanel variant={variant} radius={radius} className={cn(paddingClass[padding], className)}>
      {children}
    </GlassPanel>
  );
}

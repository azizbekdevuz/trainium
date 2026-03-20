import { cn } from "@/lib/utils/format";

type GlassPanelVariant = "surface" | "elevated" | "accent" | "sidebar";

interface GlassPanelProps {
  variant?: GlassPanelVariant;
  radius?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantClass: Record<GlassPanelVariant, string> = {
  surface: "glass-surface",
  elevated: "glass-elevated",
  accent: "glass-accent",
  sidebar: "glass-sidebar",
};

const radiusClass = {
  sm: "rounded-[8px]",
  md: "rounded-[12px]",
  lg: "rounded-[18px]",
  xl: "rounded-[24px]",
};

export function GlassPanel({
  variant = "surface",
  radius = "lg",
  className,
  children,
  style,
}: GlassPanelProps) {
  return (
    <div
      className={cn(variantClass[variant], radiusClass[radius], className)}
      style={style}
    >
      {children}
    </div>
  );
}

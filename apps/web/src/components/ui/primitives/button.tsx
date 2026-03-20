import * as React from "react"
import { cn } from "@/lib/utils/format"

const buttonVariants = {
  default: "btn-primary shadow-sm",
  destructive: "btn-danger",
  outline:
    "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface)]",
  secondary:
    "glass-surface border border-[var(--border-subtle)] text-[var(--text-primary)] hover:brightness-[1.03]",
  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] bg-transparent border-0 shadow-none",
  link: "text-[var(--accent)] underline-offset-4 hover:underline bg-transparent border-0 shadow-none h-auto px-0 py-0",
}

const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-xl px-3 text-xs",
  lg: "h-11 rounded-xl px-8",
  icon: "h-10 w-10",
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? "span" : "button"
    const sizeClasses = variant === "link" ? "h-auto min-h-0 px-0 py-0" : buttonSizes[size]
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--accent)_40%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          sizeClasses,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

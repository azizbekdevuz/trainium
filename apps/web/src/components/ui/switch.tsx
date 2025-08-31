import * as React from "react"
import { cn } from "@/lib/format"
import { Check, X } from "lucide-react"

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false)
    
    // Update internal state when external checked prop changes
    React.useEffect(() => {
      setIsChecked(checked || false)
    }, [checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setIsChecked(newChecked)
      onCheckedChange?.(newChecked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          {...props}
        />
        <div 
          className={cn(
            "relative h-7 w-12 cursor-pointer rounded-full transition-all duration-300 ease-in-out",
            "shadow-inner",
            isChecked 
              ? "bg-gradient-to-r from-cyan-500 to-blue-500" 
              : "bg-slate-200 dark:bg-slate-700",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          onClick={() => {
            const newChecked = !isChecked
            setIsChecked(newChecked)
            onCheckedChange?.(newChecked)
          }}
        >
          {/* Background glow effect when active */}
          <div className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 transition-opacity duration-300",
            isChecked ? "opacity-100" : "opacity-0"
          )} />
          
          {/* Toggle knob */}
          <div className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full transition-all duration-300 ease-in-out",
            "bg-white dark:bg-slate-100 shadow-lg",
            "flex items-center justify-center",
            "border border-slate-200 dark:border-slate-300",
            isChecked ? "translate-x-5" : "translate-x-0"
          )}>
            {/* Icons */}
            <X className={cn(
              "h-3 w-3 text-slate-400 transition-opacity duration-200",
              isChecked ? "opacity-0" : "opacity-100"
            )} />
            <Check className={cn(
              "h-3 w-3 text-cyan-600 absolute transition-opacity duration-200",
              isChecked ? "opacity-100" : "opacity-0"
            )} />
          </div>
          
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/30 scale-0 transition-transform duration-300 active:scale-110" />
        </div>
      </div>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

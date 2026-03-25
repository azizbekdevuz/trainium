import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils/format"

export interface DropdownMenuProps {
  children: React.ReactNode
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}>({
  isOpen: false,
  setIsOpen: () => {},
  triggerRef: { current: null },
})

const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLElement | null>(null)

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

export interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ className, children, asChild = false, onClick, ...props }, ref) => {
  const { isOpen, setIsOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const internalRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    triggerRef.current = internalRef.current
  })
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(!isOpen)
    onClick?.(e)
  }

  const Comp = asChild ? "span" : "button"
  return (
    <Comp
      ref={(node: HTMLElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node as HTMLButtonElement | null)
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node as HTMLButtonElement | null
      }}
      className={cn(className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Comp>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isOpen, setIsOpen, triggerRef } = React.useContext(DropdownMenuContext)
  const [pos, setPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 })

  React.useEffect(() => {
    if (!isOpen || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 224
    let left = rect.right - menuWidth
    if (left < 8) left = 8
    setPos({ top: rect.bottom + 8, left })
  }, [isOpen, triggerRef])
  
  if (!isOpen || typeof document === 'undefined') return null
  
  return createPortal(
    <>
      <div className="fixed inset-0 z-[98]" onClick={() => setIsOpen(false)} />
      <div
        ref={ref}
        style={{ position: 'fixed', top: pos.top, left: pos.left }}
        className={cn(
          "z-[99] w-56 origin-top-right",
          "frosted-panel rounded-[var(--radius-lg)]",
          "animate-fade-up duration-200",
          className
        )}
        {...props}
      >
        <div className="py-1" role="menu">
          {children}
        </div>
      </div>
    </>,
    document.body
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsOpen(false)
    onClick?.(e)
  }

  return (
    <div
      ref={ref}
      className={cn(
        "block cursor-pointer px-4 py-2 text-sm transition-colors duration-150",
        "text-ui-secondary hover:bg-ui-inset hover:text-ui-primary",
        "focus:bg-ui-inset focus:outline-none dark:text-ui-muted dark:hover:text-ui-primary",
        className
      )}
      role="menuitem"
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem }

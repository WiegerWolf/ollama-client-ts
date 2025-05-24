import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary-blue text-white hover:bg-primary-blue-hover shadow-sm hover:shadow-md",
        destructive:
          "bg-error-red text-white hover:bg-red-600 shadow-sm hover:shadow-md",
        outline:
          "border-2 border-border-primary bg-bg-primary text-text-primary hover:bg-bg-secondary hover:border-primary-blue",
        secondary:
          "bg-bg-secondary text-text-primary hover:bg-bg-tertiary border border-border-primary",
        ghost: "text-text-primary hover:bg-bg-secondary hover:text-text-primary border border-transparent hover:border-border-primary",
        link: "text-primary-blue underline-offset-4 hover:underline hover:text-primary-blue-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
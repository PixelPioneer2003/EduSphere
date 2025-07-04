"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Tailwind styles for the progress indicator with variants
const progressVariants = cva(
  "h-full w-full flex-1 bg-primary transition-all", 
  {
    variants: {
      variant: {
        default: "bg-sky-600",
        success: "bg-emerald-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Props definition for Progress component
export interface ProgressProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {}

// Updated Progress component with proper ref typing
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, variant, ...props }, ref) => {
  
    return (
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(progressVariants({ variant }))}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }

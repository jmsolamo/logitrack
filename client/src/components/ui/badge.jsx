import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-sm border border-transparent font-medium outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5",
  {
    defaultVariants: {
      size: "default",
      variant: "default",
    },
    variants: {
      size: {
        default: "h-[22px] min-w-[22px] px-[3px] text-xs",
        lg:      "h-[26px] min-w-[26px] px-[5px] text-sm",
        sm:      "h-[18px] min-w-[18px] rounded px-[3px] text-[10px]",
      },
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        error:
          "bg-red-500/10 text-red-600",
        info:
          "bg-blue-500/10 text-blue-600",
        outline:
          "border-border bg-background text-foreground hover:bg-accent/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success:
          "bg-green-500/10 text-green-700",
        warning:
          "bg-yellow-500/10 text-yellow-700",
      },
    },
  },
);

function Badge({ className, variant, size, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} data-slot="badge" {...props} />
  );
}

export { Badge, badgeVariants };

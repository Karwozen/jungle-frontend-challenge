import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "relative overflow-hidden rounded-md bg-border",
        "after:absolute after:inset-0 after:bg-linear-to-r after:from-transparent after:via-border-soft after:to-transparent motion-safe:after:animate-shimmer",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

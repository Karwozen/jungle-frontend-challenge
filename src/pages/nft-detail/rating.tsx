import { Star } from 'lucide-react'

function Rating({ average, count }: { average: number; count: number }) {
  return (
    <p className="flex shrink-0 items-center gap-1 rounded-full border border-primary px-2 py-1 text-xs">
      <Star aria-hidden className="size-3.5 fill-text-accent text-text-accent" />
      <span className="sr-only">Nota </span>
      {average.toFixed(1)}
      <span className="text-muted-foreground">({count})</span>
    </p>
  )
}

export default Rating

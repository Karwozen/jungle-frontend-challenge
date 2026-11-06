import { Skeleton } from '@/components/ui/skeleton'

function NftCardSkeleton() {
  return (
    <div className="rounded-lg bg-card p-3">
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-1 h-4 w-1/3" />
    </div>
  )
}

export default NftCardSkeleton

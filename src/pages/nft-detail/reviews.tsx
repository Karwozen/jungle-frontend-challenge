import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { reviewsQuery } from '@/domain/catalog/queries'
import { formatDay } from '@/lib/date'

function Reviews({ nftId }: { nftId: string }) {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, refetch } = useQuery(reviewsQuery(nftId, page))

  if (isPending) return <Skeleton className="h-40 w-full" />

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-sm">Não foi possível carregar as avaliações.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  if (!data.items.length) return <p className="text-sm text-muted-foreground">Este NFT ainda não tem avaliações.</p>

  return (
    <div>
      <ul className="space-y-6">
        {data.items.map((review) => (
          <li key={review.id}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-sm font-bold">{review.author.name}</p>
              <p className="flex items-center gap-0.5" role="img" aria-label={`${review.rating} de 5 estrelas`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    aria-hidden
                    className={i < review.rating ? 'size-3.5 fill-text-accent text-text-accent' : 'size-3.5 text-border-soft'}
                  />
                ))}
              </p>
              <time dateTime={review.createdAt} className="text-tiny text-muted-foreground">
                {formatDay(review.createdAt)}
              </time>
            </div>
            <p className="mt-2 text-sm text-text-secondary">{review.body}</p>
          </li>
        ))}
      </ul>

      {data.totalPages > 1 && (
        <nav aria-label="Paginação das avaliações" className="mt-8 flex justify-center gap-2 md:justify-end">
          <Button variant="outline" size="icon" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft />
          </Button>
          <span className="flex items-center px-2 text-sm" aria-live="polite">
            {page} de {data.totalPages}
          </span>
          <Button variant="outline" size="icon" aria-label="Próxima página" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}

export default Reviews

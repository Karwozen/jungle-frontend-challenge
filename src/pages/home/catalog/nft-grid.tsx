import { Link } from '@tanstack/react-router'
import NftCard from '@/components/nft/nft-card'
import NftCardSkeleton from '@/components/nft/nft-card-skeleton'
import { Button } from '@/components/ui/button'
import type { CatalogPage } from '@/domain/catalog/schema'
import { cn } from '@/lib/utils'

interface NftGridProps {
  page?: CatalogPage
  pageSize: number
  isError: boolean
  isStale: boolean
  onRetry: () => void
}

function NftGrid({ page, pageSize, isError, isStale, onRetry }: NftGridProps) {
  if (isError && !page) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-lg bg-card p-10 text-center">
        <p className="text-sm">Não foi possível carregar os NFTs.</p>
        <Button onClick={onRetry}>Tentar novamente</Button>
      </div>
    )
  }

  if (!page) {
    return (
      <ul
        className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:gap-6"
        aria-busy
      >
        {Array.from({ length: pageSize }, (_, i) => (
          <li key={i}>
            <NftCardSkeleton />
          </li>
        ))}
      </ul>
    )
  }

  if (!page.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-card p-10 text-center">
        <p className="text-sm">Nenhum NFT encontrado para esses filtros.</p>
        <Button asChild>
          <Link to="." search={{}} resetScroll={false}>
            Limpar filtros
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <ul
      aria-busy={isStale}
      className={cn(
        'grid grid-cols-2 gap-4 transition-opacity md:grid-cols-3 lg:gap-6',
        isStale && 'opacity-60 delay-200',
      )}
    >
      {page.items.map((nft, index) => (
        <li key={nft.id}>
          <NftCard nft={nft} priority={index < 2} />
        </li>
      ))}
    </ul>
  )
}

export default NftGrid

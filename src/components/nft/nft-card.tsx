import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/domain/catalog/schema'
import { rarityLabels } from '@/features/catalog/labels'
import { formatEth } from '@/lib/eth'
import { imageSrcSet } from '@/lib/images'
import { cn } from '@/lib/utils'
import FavoriteButton from './favorite-button'

// Define carregamento prioritário (eager + high fetchPriority) para os primeiros itens visíveis na dobra inicial
function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  return (
    <div className="group relative">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="block rounded-lg bg-card p-3 outline-none max-md:px-0 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="relative">
          <div className="overflow-hidden rounded-md">
            <img
              src={nft.image.url}
              srcSet={imageSrcSet(nft.image)}
              sizes="(min-width: 1024px) 270px, (min-width: 768px) 30vw, 45vw"
              width={nft.image.width}
              height={nft.image.height}
              alt={nft.name}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              className="aspect-square w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
            />
          </div>
          {nft.rarity !== 'common' && (
            <span
              className={cn(
                'absolute top-0 -left-3 px-4 py-2 text-xs max-md:left-0 font-bold uppercase md:px-5 md:py-3 md:text-sm',
                nft.rarity === 'epic' ? 'bg-purple-700 text-white' : 'bg-primary text-primary-foreground',
              )}
            >
              {rarityLabels[nft.rarity]}
            </span>
          )}
          {nft.soldOut && (
            <span className="absolute bottom-2 left-2 rounded-sm bg-background/90 px-2 py-1 text-tiny font-bold uppercase">
              Esgotado
            </span>
          )}
        </div>
        <h3 className="mt-3 truncate text-xs max-md:px-3">{nft.name}</h3>
        <p className="mt-1 flex items-baseline gap-2 text-xs max-md:px-3">
          <span className="font-bold text-text-accent">{formatEth(nft.price)}</span>
          {nft.previousPrice && (
            <s className="text-muted-foreground">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPrice)}
            </s>
          )}
        </p>
      </Link>
      <FavoriteButton nftId={nft.id} name={nft.name} className="absolute top-5 right-2 md:right-5" />
    </div>
  )
}

export default NftCard

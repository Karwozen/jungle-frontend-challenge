import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { spotlightQuery } from '@/domain/catalog/queries'
import { imageSrcSet } from '@/lib/images'

function FeaturedNft() {
  const { data, isPending } = useQuery(spotlightQuery)

  if (isPending) return <Skeleton className="mt-8 aspect-4/5 w-full flex-1" />
  if (!data) return null

  const { nft, badge } = data

  return (
    <section aria-labelledby="nft-destaque" className="mt-8 flex flex-1 flex-col">
      <Link
        to="/nft/$id"
        params={{ id: nft.id }}
        className="group flex flex-1 flex-col overflow-hidden rounded-lg bg-surface-dark outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <div className="p-4">
          <h2 id="nft-destaque" className="text-lg font-bold uppercase text-text-accent">
            NFT em destaque
          </h2>
          {badge && <p className="mt-2 text-sm font-bold uppercase">{badge}</p>}
        </div>
        <div className="relative min-h-64 flex-1 overflow-hidden rounded-lg">
          <img
            src={nft.image.url}
            srcSet={imageSrcSet(nft.image)}
            sizes="300px"
            width={nft.image.width}
            height={nft.image.height}
            alt={nft.name}
            loading="lazy"
            className="absolute inset-0 size-full rounded-lg object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
          />
        </div>
      </Link>
    </section>
  )
}

export default FeaturedNft

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from '@tanstack/react-router'
import { ChevronLeft, Heart } from 'lucide-react'
import Breadcrumb from '@/components/layout/breadcrumb'
import NotFound from '@/components/layout/not-found'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { nftDetailQuery } from '@/domain/catalog/queries'
import { useFavorite } from '@/features/favorites/use-favorite'
import { ApiError } from '@/lib/http'
import { cn } from '@/lib/utils'
import DetailsTabs from './details-tabs'
import Gallery from './gallery'
import PurchasePanel from './purchase-panel'
import RelatedNfts from './related-nfts'

function NftDetail() {
  const { id: nftId } = useParams({ from: '/nft/$id' })
  const router = useRouter()
  const { data: nft, error, isPending, refetch } = useQuery(nftDetailQuery(nftId))
  const favorite = useFavorite(nftId)

  if (isPending) {
    return (
      <div className="mx-auto grid w-full max-w-300 gap-8 px-6 pt-6 md:grid-cols-2 md:pt-10 xl:px-0" aria-busy>
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    if (error instanceof ApiError && error.code === 'NOT_FOUND') return <NotFound />
    return (
      <div role="alert" className="mx-auto flex max-w-300 flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-sm">Não foi possível carregar este NFT.</p>
        <Button onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-300 max-md:pb-40 md:px-6 md:pt-10 xl:px-0">
      <Breadcrumb />

      <div className="max-md:rounded-b-[2rem] max-md:bg-card max-md:pt-5">
        <div className="flex items-center justify-between px-7 pb-4 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Voltar"
            className="rounded-full border-primary/60 bg-transparent text-text-accent"
            onClick={() => router.history.back()}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={favorite.active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            aria-pressed={favorite.active}
            className="rounded-full border-primary/60 bg-transparent text-text-accent"
            onClick={favorite.toggle}
          >
            <Heart className={cn(favorite.active && 'fill-red-500 text-red-500')} />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 md:gap-12">
          <div className="max-md:px-7">
            <Gallery nft={nft} />
          </div>
          <PurchasePanel key={nft.id} nft={nft} />
        </div>
      </div>

      <div className="px-6 md:px-0">
        <DetailsTabs key={nft.id} nft={nft} />
        <RelatedNfts nft={nft} />
      </div>
    </div>
  )
}

export default NftDetail

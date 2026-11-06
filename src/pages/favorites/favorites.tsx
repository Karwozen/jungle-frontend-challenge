import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import AccountSidebar from '@/components/layout/account-sidebar'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import NftCard from '@/components/nft/nft-card'
import NftCardSkeleton from '@/components/nft/nft-card-skeleton'
import { Button } from '@/components/ui/button'
import { nftDetailQuery } from '@/domain/catalog/queries'
import { favoritesQuery } from '@/domain/favorites/queries'
import { useSession } from '@/features/auth/use-session'

function Favorites() {
  const { data: session } = useSession()
  const { data, isPending, isError, refetch } = useQuery({ ...favoritesQuery(session?.user.id ?? ''), enabled: !!session })
  const ids = data?.nftIds ?? []
  const details = useQueries({ queries: ids.map((id) => nftDetailQuery(id)) })
  const items = details.flatMap((query) => (query.data ? [query.data] : []))
  const loading = isPending || details.some((query) => query.isPending)

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 md:py-10 xl:px-0">
      <MobilePageHeader title="Lista de interesse" toHome />

      <div className="grid gap-8 md:grid-cols-[17rem_1fr]">
        <AccountSidebar current="favorites" />

        <section aria-labelledby="favorites-title" className="min-w-0">
          <h1 id="favorites-title" className="font-bold">
            Lista de interesse
          </h1>

          {isError ? (
            <div role="alert" className="mt-6 flex flex-col items-start gap-3">
              <p className="text-sm">Não foi possível carregar sua lista.</p>
              <Button onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          ) : loading ? (
            <ul aria-busy className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <li key={i}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-4 rounded-lg bg-card p-10 text-center">
              <p className="text-sm text-muted-foreground">Você ainda não favoritou nenhum NFT.</p>
              <Button asChild>
                <Link to="/" hash="catalogo">
                  Explorar NFTs
                </Link>
              </Button>
            </div>
          ) : (
            <ul aria-label="NFTs favoritados" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {items.map((nft) => (
                <li key={nft.id}>
                  <NftCard nft={nft} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

export default Favorites

import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '../../components/ui/button'
import { api } from '../../shared/api'
import type { Nft } from '../../shared/contracts'
import { sessionQuery } from '../account/session'
import { favoriteQuery } from './favorites'
import { NftCard } from './NftCard'

export function FavoriteCollection() {
  const session = useQuery(sessionQuery)
  const favorites = useQuery(favoriteQuery(session.data?.user?.id))
  const works = useQueries({
    queries: (favorites.data ?? []).map(id => ({
      queryKey: ['nft', id],
      queryFn: async ({ signal }: { signal: AbortSignal }) => (await api.get<Nft>(`/nfts/${encodeURIComponent(id)}`, { signal })).data,
      retry: false,
    })),
  })
  const failed = works.filter(work => work.isError)
  return (
    <main id="content" className="market-container detail-page favorites-page">
      <h1>Favoritos</h1>
      {favorites.isPending || works.some(work => work.isPending) ? <p role="status">Carregando favoritos…</p> : null}
      {favorites.isError && <p role="alert">Falha ao carregar favoritos. <Button onClick={() => void favorites.refetch()}>Tentar novamente</Button></p>}
      {failed.length > 0 && <p role="alert">Algumas obras não carregaram. <Button onClick={() => void Promise.all(failed.map(work => work.refetch()))}>Tentar novamente</Button></p>}
      {favorites.data?.length === 0 && <div className="empty-state">
        <p>Você ainda não adicionou NFTs aos favoritos.</p>
        <Link className="text-link" to="/" search={{ q: '', collection: '', page: 1, sort: 'recent' }} hash="market">Explorar o mercado</Link>
      </div>}
      {works.some(work => work.data) && <ul className="nft-grid">
        {works.flatMap(work => work.data ? [<NftCard key={work.data.id} nft={work.data} showFavorite/>] : [])}
      </ul>}
    </main>
  )
}

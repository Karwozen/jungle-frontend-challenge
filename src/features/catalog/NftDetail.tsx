import { useEffect, useState } from 'react'
import { createSocket } from '../../app/realtime'
import { queryClient } from '../../app/query'
import { resolveEdition } from '../../shared/editions'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { api } from '../../shared/api'
import type { CatalogResponse, Nft } from '../../shared/contracts'
import { Button } from '../../components/ui/button'
import { Artwork } from './Artwork'
import { NftCard } from './NftCard'
import { AddToCart } from '../cart/AddToCart'
import { FavoriteButton } from './FavoriteButton'
const emptySearch = { q: '', collection: '', sort: 'recent' as const, page: 1 }
export function NftDetail() {
  const [zoomed, setZoomed] = useState(false)
  const [gallerySelection, setGallerySelection] = useState({ nftId: '', index: 0 })
  const [selection, setSelection] = useState({ nftId: '', editionId: 'standard' })
  const { nftId } = useParams({ from: '/nfts/$nftId' })
  useEffect(() => {
    const socket = createSocket()
    const reconcile = () => { void queryClient.invalidateQueries({ queryKey: ['nft', nftId] }) }
    socket.on('connect', reconcile)
    socket.on('nft.updated', reconcile)
    socket.connect()
    return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [nftId])
  const nft = useQuery({ queryKey: ['nft', nftId], queryFn: async ({ signal }) => (await api.get<Nft>(`/nfts/${encodeURIComponent(nftId)}`, { signal })).data, retry: false })
  const related = useQuery({ queryKey: ['nfts', 'related', nft.data?.collection], queryFn: async ({ signal }) => (await api.get<CatalogResponse>('/nfts', { params: { collection: nft.data?.collection }, signal })).data, enabled: Boolean(nft.data) })
  const selectedId = selection.nftId === nftId ? selection.editionId : 'standard'
  const edition = nft.data && resolveEdition(nft.data, selectedId)
  const gallery = nft.data?.gallery?.length ? nft.data.gallery : nft.data?.artwork ? [nft.data.artwork] : []
  const galleryIndex = gallerySelection.nftId === nftId && gallerySelection.index < gallery.length ? gallerySelection.index : 0
  return <main id="content" className="market-container detail-page">
    <nav aria-label="Caminho de navegação" className="breadcrumbs"><Link to="/" search={emptySearch}>Início</Link><ChevronRight size={12}/><Link to="/" search={emptySearch} hash="market">Mercado</Link><ChevronRight size={12}/><span>NFT</span></nav>
    {nft.isPending ? <div className="detail-layout" aria-label="Carregando NFT"><div className="skeleton aspect-square rounded-xl"/><div><div className="skeleton h-10 w-4/5"/><div className="skeleton mt-5 h-6 w-1/3"/><div className="skeleton mt-10 h-40"/></div></div> : nft.isError ? <div role="alert" className="empty-state"><h1>Não foi possível abrir este NFT</h1><p>Ele pode não existir ou estar temporariamente indisponível.</p><Button onClick={() => void nft.refetch()}>Tentar novamente</Button><Button asChild variant="ghost"><Link to="/" search={emptySearch}><ArrowLeft size={16}/> Voltar ao mercado</Link></Button></div> : <>
      <div className="detail-layout nft-detail-layout"><Link to="/" search={emptySearch} hash="market" className="detail-back" aria-label="Voltar ao mercado"><ArrowLeft size={19} aria-hidden="true"/></Link><div className="detail-gallery"><div className={`detail-thumbnails${new Set(gallery).size > 1 ? ' has-distinct-images' : ''}`} aria-label="Imagens do NFT">{gallery.map((artwork, index) => <button type="button" key={`${index}:${artwork}`} className={`detail-thumbnail${index === galleryIndex ? ' is-selected' : ''}`} aria-label={`Mostrar imagem ${index + 1} de ${gallery.length}`} aria-pressed={index === galleryIndex} onClick={() => { setGallerySelection({ nftId, index }); setZoomed(false) }}><Artwork nft={{ ...nft.data, artwork }}/></button>)}</div><div className="detail-art"><button type="button" className="detail-zoom" aria-label={zoomed ? 'Reduzir imagem' : 'Ampliar imagem'} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}><ZoomIn size={20} aria-hidden="true"/></button><div className={`detail-art-frame${zoomed ? ' is-zoomed' : ''}`}><Artwork nft={{ ...nft.data, artwork: gallery[galleryIndex] ?? nft.data.artwork }} large priority/></div></div></div><section className="detail-information"><p className="collection-eyebrow">{nft.data.collection}</p><h1>{nft.data.name}</h1><p className="detail-price">{edition?.price ?? nft.data.price} <span>ETH</span></p><div className="detail-divider"/><p className="detail-description">{nft.data.description || 'Uma obra da coleção Original Apes. Uma interpretação de personalidade, cor e expressão na cultura digital.'}</p><dl className="nft-facts"><div><dt>Coleção</dt><dd>{nft.data.collection}</dd></div><div><dt>Criador</dt><dd>{nft.data.creator || 'KURIO Editions'}</dd></div><div><dt>Rede</dt><dd>{nft.data.network}</dd></div><div><dt>Disponibilidade</dt><dd>{edition?.available ? `${edition.available} unidades` : 'Esgotado'}</dd></div></dl><fieldset className="edition-selector"><legend>Edição</legend><div>{[...nft.data.editions].sort((a, b) => ['1/1', '1/10', '1/50', 'Aberta'].indexOf(a.name) - ['1/1', '1/10', '1/50', 'Aberta'].indexOf(b.name)).map(item => <label key={item.id} className={selectedId === item.id ? 'edition-selected' : ''}><input type="radio" name="edition" value={item.id} checked={selectedId === item.id} onChange={() => setSelection({ nftId, editionId: item.id })}/><span>{item.name}</span><span className="sr-only">{!resolveEdition(nft.data, item.id)?.available ? ' — Esgotada' : ''}</span></label>)}</div></fieldset><div className="nft-actions"><FavoriteButton nftId={nft.data.id}/><AddToCart key={`${nftId}:${selectedId}`} editionId={selectedId} nft={{ ...nft.data, price: edition?.price ?? nft.data.price, available: edition?.available ?? 0 }}/></div><div className="simulation-notice"><span aria-hidden="true">◇</span><p>Este marketplace é uma demonstração. Carteiras, transações e compras são simuladas.</p></div></section></div>

      <section className="nft-story"><h2>Detalhes do NFT</h2><p>{nft.data.description || 'Arte digital selecionada para colecionadores da comunidade KURIO.'}</p><p>Arte da coleção {nft.data.collection}. Os valores e a disponibilidade exibidos são fornecidos pela simulação do marketplace.</p></section>
      {related.data && <section className="related-works"><div className="section-heading"><h2>Mais desta coleção</h2><Link to="/" search={{ ...emptySearch, collection: nft.data.collection }} hash="market">Ver coleção <ChevronRight size={14}/></Link></div><ul className="nft-grid">{related.data.items.filter(item => item.id !== nftId).slice(0, 3).map(item => <NftCard key={item.id} nft={item}/>)}</ul></section>}
    </>}
  </main>
}

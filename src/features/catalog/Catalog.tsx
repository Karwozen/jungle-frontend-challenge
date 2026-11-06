import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, Search, SlidersHorizontal, X } from 'lucide-react'
import { api } from '../../shared/api'
import { Button } from '../../components/ui/button'
import { createSocket } from '../../app/realtime'
import { queryClient } from '../../app/query'
import type { CatalogResponse } from '../../shared/contracts'
import { catalogSearch, type CatalogSearch } from '../../shared/catalog'
import { NftCard } from './NftCard'
import { Artwork } from './Artwork'
import { FeaturedArtwork } from './FeaturedArtwork'
import { HomeSections } from './HomeSections'
import { useMobileLayout } from '../../shared/useMobileLayout'
import { parseEth } from '../../shared/money'

const catalogViews = [
  { value: undefined, label: 'Todos os NFTs' },
  { value: 'new', label: 'Novos lançamentos' },
  { value: 'trending', label: 'Em alta' },
] as const

export function Catalog() {
  const mobile = useMobileLayout()
  const search = catalogSearch.parse(useSearch({ strict: false }))
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [priceError, setPriceError] = useState('')
  const catalog = useQuery({ queryKey: ['nfts', search], queryFn: async ({ signal }) => (await api.get<CatalogResponse>('/nfts', { params: search, signal })).data })
  useEffect(() => {
    const socket = createSocket()
    const reconcile = () => { void queryClient.invalidateQueries({ queryKey: ['nfts'] }) }
    socket.on('connect', reconcile); socket.on('nft.updated', reconcile); socket.connect()
    return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [])
  const update = (patch: Partial<CatalogSearch>) => void navigate({ search: old => ({ ...old, page: 1, ...patch }) })
  const pages = catalog.data ? Math.ceil(catalog.data.total / catalog.data.pageSize) : 0
  const hasFilters = Boolean(search.q || search.collection || search.network || search.minPrice || search.maxPrice || search.view)
  const searchForm = (<form role="search" id="market-search" className="market-search" onSubmit={event => { event.preventDefault(); update({ q: String(new FormData(event.currentTarget).get('q') ?? '') }) }}>
          <div className="search-field"><button type="submit" className="search-icon-submit" aria-label="Buscar"><Search size={20} aria-hidden="true"/></button><input key={search.q} name="q" defaultValue={search.q} placeholder={mobile ? 'Explorar coleções' : 'Buscar por nome da obra'} type="search" autoComplete="off" aria-label="Buscar NFT"/></div>
          <Button className="mobile-filter-button" variant="outline" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(open => !open)} type="button"><SlidersHorizontal size={20}/><span className="sr-only">Filtros</span></Button>
        </form>)
  const sortControl = (
    <label className="sort-label">Ordenar por<select value={search.sort} onChange={e => update({ sort: e.target.value as CatalogSearch['sort'] })}><option value="recent">Listados recentemente</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select></label>
  )
  const filters = (<aside id="catalog-filters" className={`catalog-filters ${filtersOpen ? 'filters-expanded' : ''}`}>
        <div className="filter-title"><h2>Coleções</h2><button className="mobile-close-filters icon-button" aria-label="Fechar filtros" onClick={() => setFiltersOpen(false)}><X size={18}/></button></div>
        <label htmlFor="collection">Coleção</label><select id="collection" value={search.collection} onChange={e => update({ collection: e.target.value })}><option value="">Todas as coleções</option><option>Original Apes</option></select>
        <form className="price-filter" key={`${search.minPrice}-${search.maxPrice}`} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget), minPrice = String(data.get('minPrice') || ''), maxPrice = String(data.get('maxPrice') || ''); if (minPrice && maxPrice && parseEth(minPrice) > parseEth(maxPrice)) { setPriceError('O preço mínimo não pode ser maior que o máximo.'); return } setPriceError(''); update({ minPrice: minPrice || undefined, maxPrice: maxPrice || undefined }) }}><h3>Faixa de preço</h3><label htmlFor="min-price">Preço mínimo (ETH)</label><input id="min-price" name="minPrice" type="text" inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,18})?" defaultValue={search.minPrice} aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'price-error' : undefined}/><label htmlFor="max-price">Preço máximo (ETH)</label><input id="max-price" name="maxPrice" type="text" inputMode="decimal" pattern="[0-9]{1,12}(\.[0-9]{1,18})?" defaultValue={search.maxPrice} aria-invalid={Boolean(priceError)} aria-describedby={priceError ? 'price-error' : undefined}/>{priceError && <p id="price-error" className="field-error" role="alert">{priceError}</p>}<Button type="submit">Aplicar</Button></form>
        <div className="network-filter"><label htmlFor="network-filter">Rede</label><select id="network-filter" value={search.network || ''} onChange={event => update({ network: event.target.value ? event.target.value as 'Ethereum' | 'Polygon' | 'Solana' : undefined })}><option value="">Todas as redes</option><option>Ethereum</option><option>Polygon</option><option>Solana</option></select></div>
        {mobile && sortControl}
        {hasFilters && <Button variant="ghost" onClick={() => update({ q: '', collection: '', network: undefined, minPrice: undefined, maxPrice: undefined, sort: 'recent', view: undefined })}><X size={14}/> Limpar filtros</Button>}
      </aside>)

  return <main id="content" className="market-container market-home">
    {mobile && searchForm}
    {mobile && filters}
    <section className="hero-copy" aria-labelledby="hero-title">
      <div className="hero-text"><p className="hero-eyebrow">Bem-vindo à KURIO</p><h1 id="hero-title">{mobile ? <>SEJA DONO DA<br/>CULTURA DIGITAL</> : <>SEJA DONO DO FUTURO<br/>DA ARTE DIGITAL</>}</h1><p className="hero-description">{mobile ? 'Descubra NFTs selecionados de criadores do mundo todo.' : 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e faça parte da cultura do amanhã.'}</p><Button asChild><a href="#market">Explorar <ArrowRight size={16} aria-hidden="true"/></a></Button></div>
      <FeaturedArtwork/>
    </section>
    <section id="market" aria-label="Mercado de NFTs" className="market-layout">
      {!mobile && <div className="catalog-sidebar">{filters}
        <Link className="catalog-feature" to="/nfts/$nftId" params={{ nftId: 'sage-nomad-9' }}>
          <span>NFT em destaque</span>
          <strong>Sage Nomad #009</strong>
          <Artwork nft={{ name: 'Sage Nomad #009', artwork: '/assets/art/sage-nomad' }}/>
        </Link>
      </div>}
      <div className="catalog-results">
        {!mobile && searchForm}
        <div className="catalog-toolbar">
          <nav className="catalog-views" aria-label="Vitrines do catálogo">
            {catalogViews.map(({ value, label }) => (
              <button key={label} type="button" aria-pressed={search.view === value} onClick={() => update({ view: value })}>
                {label}
              </button>
            ))}
          </nav>{!mobile && sortControl}</div>
        {catalog.isPending ? <div className="nft-grid" aria-label="Carregando NFTs">{Array.from({ length: 9 }, (_, i) => <div key={i} className="card-skeleton"><div className="skeleton aspect-square rounded-lg"/><div className="skeleton mt-4 h-4 w-4/5"/><div className="skeleton mt-3 h-4 w-1/2"/></div>)}</div> : catalog.isError ? <div role="alert" className="empty-state"><h3>O catálogo não carregou.</h3><p>Não conseguimos buscar as obras. Tente novamente.</p><Button onClick={() => void catalog.refetch()}>Tentar novamente</Button></div> : <>
          <p role="status" className="results-count">{catalog.data.total} NFTs encontrados{catalog.isFetching ? ' · Atualizando…' : ''}</p>
          <ul className="nft-grid">{catalog.data.items.map(nft => <NftCard key={nft.id} nft={nft} showFavorite={mobile}/>)}</ul>
          {catalog.data.items.length === 0 && <div className="empty-state"><Search size={30} aria-hidden="true"/><h3>Nenhuma obra por aqui.</h3><p>Experimente outro nome ou ajuste a coleção.</p><Button variant="outline" onClick={() => update({ q: '', collection: '', network: undefined, minPrice: undefined, maxPrice: undefined, view: undefined })}>Limpar busca e filtros</Button></div>}
          <nav aria-label="Paginação" className="catalog-pagination">{Array.from({ length: pages }, (_, i) => <Button variant={search.page === i + 1 ? 'default' : 'ghost'} aria-current={search.page === i + 1 ? 'page' : undefined} key={i} onClick={() => update({ page: i + 1 })}>{i + 1}</Button>)}</nav>
        </>}
      </div>
    </section>
    <HomeSections/>
  </main>
}

import { http, HttpResponse } from 'msw'
import { compareEth } from '@/lib/eth'
import {
  catalogQuery,
  categories,
  networks,
  nftSummary,
  review,
  type CatalogPage,
  type CatalogQuery,
  type Nft,
  type ReviewsPage,
} from '@/domain/catalog/schema'
import { MOCK_NOW } from '@/mocks/clock'
import { getFeatured, getSpotlight, trendingIds } from '@/mocks/data/catalog'
import { getDb } from '@/mocks/db'
import { apiError, notFound } from '@/mocks/responses'
import { getScenario, simulate } from '@/mocks/scenarios'

const PAGE_SIZE = 9
const REVIEWS_PAGE_SIZE = 5
const DAY_MS = 86_400_000

function plain(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function list(params: URLSearchParams, key: string) {
  const raw = params.get(key)
  return raw ? raw.split(',').filter(Boolean) : undefined
}

function readQuery(url: URL) {
  const p = url.searchParams
  const page = p.get('page')
  const trending = p.get('trending')
  const listedWithinDays = p.get('listedWithinDays')
  return catalogQuery.safeParse({
    q: p.get('q') || undefined,
    categories: list(p, 'categories'),
    networks: list(p, 'networks'),
    collection: p.get('collection') || undefined,
    exclude: p.get('exclude') || undefined,
    minPrice: p.get('minPrice') || undefined,
    maxPrice: p.get('maxPrice') || undefined,
    trending: trending ? trending === 'true' : undefined,
    listedWithinDays: listedWithinDays ? Number(listedWithinDays) : undefined,
    sort: p.get('sort') || undefined,
    page: page ? Number(page) : undefined,
  })
}

type Facet = 'categories' | 'networks' | 'price'

// ao contar as opções de um filtro, o próprio filtro fica de fora (senão marcar
// "music" zeraria o contador das outras categorias)
function matches(item: Nft, query: CatalogQuery, skip?: Facet) {
  if (query.q) {
    const haystack = plain(
      [item.name, item.collection.name, item.tokenId, ...item.traits.map((t) => t.value)].join(' '),
    )
    if (!haystack.includes(plain(query.q))) return false
  }
  if (skip !== 'categories' && query.categories?.length && !query.categories.includes(item.category)) return false
  if (skip !== 'networks' && query.networks?.length && !query.networks.includes(item.network)) return false
  if (query.collection && item.collection.id !== query.collection) return false
  if (query.exclude && item.id === query.exclude) return false
  if (skip !== 'price' && query.minPrice && compareEth(item.price, query.minPrice) < 0) return false
  if (skip !== 'price' && query.maxPrice && compareEth(item.price, query.maxPrice) > 0) return false
  if (query.trending && !trendingIds.has(item.id)) return false
  if (query.listedWithinDays) {
    if (Date.parse(item.createdAt) < MOCK_NOW - query.listedWithinDays * DAY_MS) return false
  }
  return true
}

function hash(text: string) {
  let h = 0
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0
  return h
}

// ordem fixa e diferente por aba, intercalando as artes para não aparecer a mesma imagem em sequência
function interleave(items: Nft[]) {
  const groups = new Map<string, Nft[]>()
  for (const item of items) groups.set(item.image.url, [...(groups.get(item.image.url) ?? []), item])
  const queues = [...groups.values()]
  const result: Nft[] = []
  while (result.length < items.length) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next) result.push(next)
    }
  }
  return result
}

function sortNfts(items: Nft[], query: CatalogQuery) {
  const sorted = [...items]
  if (!query.sort && (query.trending || query.listedWithinDays)) {
    const salt = query.trending ? 'trending' : 'new'
    return interleave(sorted.sort((a, b) => hash(salt + a.id) - hash(salt + b.id)))
  }
  switch (query.sort ?? 'recent') {
    case 'price-asc':
      return sorted.sort((a, b) => compareEth(a.price, b.price))
    case 'price-desc':
      return sorted.sort((a, b) => compareEth(b.price, a.price))
    case 'rating':
      return sorted.sort((a, b) => b.rating.average - a.rating.average)
    default:
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
}

function buildPage(all: Nft[], query: CatalogQuery): CatalogPage {
  const filtered = sortNfts(all.filter((n) => matches(n, query)), query)
  const page = query.page ?? 1
  const start = (page - 1) * PAGE_SIZE

  const countBy = <K extends string>(keys: readonly K[], facet: Facet, pick: (n: Nft) => K) => {
    const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>
    for (const item of all) if (matches(item, query, facet)) counts[pick(item)]++
    return counts
  }

  // os limites ignoram a própria faixa, senão o slider encolheria ao aplicar o filtro
  const prices = all.filter((n) => matches(n, query, 'price')).map((n) => n.price)
  const price = prices.length
    ? {
        min: prices.reduce((low, p) => (compareEth(p, low) < 0 ? p : low)),
        max: prices.reduce((high, p) => (compareEth(p, high) > 0 ? p : high)),
      }
    : null

  return {
    items: filtered.slice(start, start + PAGE_SIZE).map((n) => nftSummary.parse(n)),
    page,
    pageSize: PAGE_SIZE,
    total: filtered.length,
    totalPages: Math.ceil(filtered.length / PAGE_SIZE),
    facets: {
      categories: countBy(categories, 'categories', (n) => n.category),
      networks: countBy(networks, 'networks', (n) => n.network),
      price,
    },
  }
}

export const catalogHandlers = [
  http.get('/api/nfts/featured', async () => {
    const failure = await simulate('featured')
    if (failure) return failure

    const items = getFeatured(getScenario('featured') === 'empty' ? [] : getDb().nfts).map(({ nft, badge }) => ({ nft: nftSummary.parse(nft), badge }))
    return HttpResponse.json(items)
  }),

  http.get('/api/nfts/spotlight', async () => {
    const failure = await simulate('spotlight')
    if (failure) return failure

    const item = getScenario('spotlight') === 'empty' ? undefined : getSpotlight(getDb().nfts)
    return item ? HttpResponse.json({ nft: nftSummary.parse(item.nft), badge: item.badge }) : notFound('Destaque')
  }),

  http.get('/api/nfts', async ({ request }) => {
    const failure = await simulate('nfts')
    if (failure) return failure

    const parsed = readQuery(new URL(request.url))
    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0] ?? 'query'), i.message]),
      )
      return apiError(422, 'VALIDATION', 'Parâmetros de busca inválidos.', { fields })
    }

    const all = getScenario('nfts') === 'empty' ? [] : getDb().nfts
    return HttpResponse.json(buildPage(all, parsed.data))
  }),

  http.get('/api/nfts/:id', async ({ params }) => {
    const failure = await simulate('detail')
    if (failure) return failure

    const found = getScenario('detail') === 'empty' ? undefined : getDb().nfts.find((n) => n.id === params.id)
    return found ? HttpResponse.json(found) : notFound('NFT')
  }),

  http.get('/api/nfts/:id/reviews', async ({ params, request }) => {
    const failure = await simulate('reviews')
    if (failure) return failure

    const db = getDb()
    if (!db.nfts.some((n) => n.id === params.id)) return notFound('NFT')

    const page = Math.max(1, Number(new URL(request.url).searchParams.get('page')) || 1)
    const all = getScenario('reviews') === 'empty' ? [] : db.reviews
      .filter((r) => r.nftId === params.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const start = (page - 1) * REVIEWS_PAGE_SIZE

    const body: ReviewsPage = {
      items: all.slice(start, start + REVIEWS_PAGE_SIZE).map((r) => review.parse(r)),
      page,
      pageSize: REVIEWS_PAGE_SIZE,
      total: all.length,
      totalPages: Math.ceil(all.length / REVIEWS_PAGE_SIZE),
    }
    return HttpResponse.json(body)
  }),
]

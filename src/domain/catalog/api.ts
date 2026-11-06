import { http } from '@/lib/http'
import {
  catalogPage,
  featuredItem,
  nft,
  reviewsPage,
  type CatalogPage,
  type CatalogQuery,
  type FeaturedItem,
  type Nft,
  type ReviewsPage,
} from './schema'

function toParams(query: CatalogQuery) {
  const params: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) params[key] = value.join(',')
    } else {
      params[key] = value as string | number | boolean
    }
  }
  return params
}

export async function listNfts(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
  const { data } = await http.get('/nfts', { params: toParams(query), signal })
  return catalogPage.parse(data)
}

export async function listFeatured(signal?: AbortSignal): Promise<FeaturedItem[]> {
  const { data } = await http.get('/nfts/featured', { signal })
  return featuredItem.array().parse(data)
}

export async function getSpotlight(signal?: AbortSignal): Promise<FeaturedItem> {
  const { data } = await http.get('/nfts/spotlight', { signal })
  return featuredItem.parse(data)
}

export async function getNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal })
  return nft.parse(data)
}

export async function listReviews(id: string, page = 1, signal?: AbortSignal): Promise<ReviewsPage> {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}/reviews`, { params: { page }, signal })
  return reviewsPage.parse(data)
}

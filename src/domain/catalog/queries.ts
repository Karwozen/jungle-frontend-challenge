import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { getNft, getSpotlight, listFeatured, listNfts, listReviews } from './api'
import type { CatalogQuery } from './schema'

export const catalogKeys = {
  all: ['catalog'] as const,
  list: (query: CatalogQuery) => ['catalog', 'list', query] as const,
  featured: ['catalog', 'featured'] as const,
  spotlight: ['catalog', 'spotlight'] as const,
  detail: (id: string) => ['catalog', 'detail', id] as const,
  reviews: (id: string, page: number) => ['catalog', 'detail', id, 'reviews', page] as const,
}

export const catalogListQuery = (query: CatalogQuery) =>
  queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) => listNfts(query, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const featuredQuery = queryOptions({
  queryKey: catalogKeys.featured,
  queryFn: ({ signal }) => listFeatured(signal),
  staleTime: 60_000,
})

export const spotlightQuery = queryOptions({
  queryKey: catalogKeys.spotlight,
  queryFn: ({ signal }) => getSpotlight(signal),
  staleTime: 60_000,
})

export const nftDetailQuery = (id: string) =>
  queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
    staleTime: 60_000,
  })

export const reviewsQuery = (id: string, page: number) =>
  queryOptions({
    queryKey: catalogKeys.reviews(id, page),
    queryFn: ({ signal }) => listReviews(id, page, signal),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })

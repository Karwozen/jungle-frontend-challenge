import { z } from 'zod'
import { categories, networks, sortKeys, type CatalogQuery } from '@/domain/catalog/schema'
import { ethAmount } from '@/domain/common/schema'

export const tabs = ['all', 'new', 'trending'] as const

const NEW_LISTING_DAYS = 7

export const catalogSearch = z.object({
  q: z.string().trim().min(1).optional().catch(undefined),
  tab: z.enum(tabs).optional().catch(undefined),
  categories: z.array(z.enum(categories)).min(1).optional().catch(undefined),
  networks: z.array(z.enum(networks)).min(1).optional().catch(undefined),
  minPrice: ethAmount.optional().catch(undefined),
  maxPrice: ethAmount.optional().catch(undefined),
  sort: z.enum(sortKeys).optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
})

export type CatalogSearch = z.infer<typeof catalogSearch>

export function toCatalogQuery({ tab, q, categories, networks, minPrice, maxPrice, sort, page }: CatalogSearch): CatalogQuery {
  // só os campos do catálogo: a URL também carrega auth, redirect e outros que não são da consulta
  return {
    q,
    categories,
    networks,
    minPrice,
    maxPrice,
    sort,
    page,
    trending: tab === 'trending' || undefined,
    listedWithinDays: tab === 'new' ? NEW_LISTING_DAYS : undefined,
  }
}

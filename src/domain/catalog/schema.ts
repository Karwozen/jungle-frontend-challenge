import { z } from 'zod'
import { ethAmount, image, isoDate, pageOf } from '@/domain/common/schema'

export const categories = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
] as const

export const networks = ['ethereum', 'polygon', 'solana'] as const

export const rarities = ['common', 'rare', 'epic'] as const

export const sortKeys = ['recent', 'price-asc', 'price-desc', 'rating'] as const

export const edition = z.object({
  id: z.string(),
  kind: z.enum(['limited', 'open']),
  supply: z.number().int().positive().nullable(), // null: edição aberta
  available: z.number().int().nonnegative().nullable(),
  price: ethAmount,
})

const collectionRef = z.object({ id: z.string(), name: z.string() })

export const nftSummary = z.object({
  id: z.string(),
  name: z.string(),
  image,
  category: z.enum(categories),
  network: z.enum(networks),
  rarity: z.enum(rarities),
  collection: collectionRef,
  price: ethAmount,
  previousPrice: ethAmount.nullable(),
  soldOut: z.boolean(),
  createdAt: isoDate,
  version: z.number().int().nonnegative(),
})

export const nft = nftSummary.extend({
  tokenId: z.string(),
  summary: z.string(),
  description: z.string(),
  collection: collectionRef.extend({
    creator: z.object({ id: z.string(), name: z.string() }),
    royaltyPercent: z.number(),
  }),
  gallery: z.array(image).min(1),
  traits: z.array(z.object({ type: z.string(), value: z.string() })),
  rating: z.object({ average: z.number().min(0).max(5), count: z.number().int() }),
  editions: z.array(edition).min(1),
  contract: z.object({
    address: z.string(),
    standard: z.string(),
    verified: z.boolean(),
  }),
  maxPerOrder: z.number().int().positive(),
})

export const featuredItem = z.object({ nft: nftSummary, badge: z.string().nullable() })

export const review = z.object({
  id: z.string(),
  author: z.object({ id: z.string(), name: z.string() }),
  rating: z.number().int().min(1).max(5),
  body: z.string(),
  createdAt: isoDate,
})

export const reviewsPage = pageOf(review)

export const catalogQuery = z.object({
  q: z.string().optional(),
  categories: z.array(z.enum(categories)).optional(),
  networks: z.array(z.enum(networks)).optional(),
  collection: z.string().optional(),
  exclude: z.string().optional(),
  minPrice: ethAmount.optional(),
  maxPrice: ethAmount.optional(),
  trending: z.boolean().optional(),
  listedWithinDays: z.number().int().positive().optional(),
  sort: z.enum(sortKeys).optional(),
  page: z.number().int().positive().optional(),
})

export const priceRange = z.object({ min: ethAmount, max: ethAmount })

export const facetCounts = z.object({
  categories: z.record(z.enum(categories), z.number().int()),
  networks: z.record(z.enum(networks), z.number().int()),
  // ausente quando o backend ainda não calcula a faixa; null quando não sobra nenhum NFT
  price: priceRange.nullable().optional(),
})

export const catalogPage = pageOf(nftSummary).extend({ facets: facetCounts })

export type PriceRange = z.infer<typeof priceRange>
export type FeaturedItem = z.infer<typeof featuredItem>
export type Review = z.infer<typeof review>
export type ReviewsPage = z.infer<typeof reviewsPage>
export type Edition = z.infer<typeof edition>
export type NftSummary = z.infer<typeof nftSummary>
export type Nft = z.infer<typeof nft>
export type CatalogQuery = z.infer<typeof catalogQuery>
export type CatalogPage = z.infer<typeof catalogPage>
export type Category = (typeof categories)[number]
export type Network = (typeof networks)[number]
export type Rarity = (typeof rarities)[number]

import { z } from 'zod'
export const catalogSearch = z.object({
  q: z.string().max(100).catch(''), collection: z.string().catch(''),
  network: z.enum(['Ethereum', 'Polygon', 'Solana']).optional().catch(undefined),
  minPrice: z.coerce.string().regex(/^\d{1,12}(?:\.\d{1,18})?$/).optional().catch(undefined),
  maxPrice: z.coerce.string().regex(/^\d{1,12}(?:\.\d{1,18})?$/).optional().catch(undefined),
  view: z.enum(['new', 'trending']).optional().catch(undefined),
  sort: z.enum(['recent', 'price-asc', 'price-desc']).catch('recent'),
  page: z.coerce.number().int().min(1).max(10000).catch(1),
})
export type CatalogSearch = z.infer<typeof catalogSearch>

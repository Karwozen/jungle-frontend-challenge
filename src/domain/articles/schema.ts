import { z } from 'zod'
import { image, isoDate, pageOf } from '@/domain/common/schema'

export const articleSummary = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  image,
  publishedAt: isoDate,
  readingMinutes: z.number().int().positive(),
})

export const articlesPage = pageOf(articleSummary)

export type ArticleSummary = z.infer<typeof articleSummary>
export type ArticlesPage = z.infer<typeof articlesPage>

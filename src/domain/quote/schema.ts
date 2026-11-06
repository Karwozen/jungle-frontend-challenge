import { z } from 'zod'
import { cartLine } from '@/domain/cart/schema'
import { ethAmount, isoDate } from '@/domain/common/schema'

export const lineIssues = ['sold-out', 'insufficient-stock', 'over-limit'] as const

export const changeKinds = ['price', 'fee', 'coupon'] as const

export const quoteRequest = z.object({
  items: z.array(cartLine).max(50),
  coupon: z.string().trim().optional(),
})

export const quoteLine = cartLine.extend({
  unitPrice: ethAmount,
  total: ethAmount,
  available: z.number().int().nonnegative().nullable(),
  nftVersion: z.number().int().nonnegative(),
  issue: z.enum(lineIssues).nullable(),
})

export const quote = z.object({
  id: z.string(),
  expiresAt: isoDate,
  items: z.array(quoteLine),
  coupon: z.object({ code: z.string(), percent: z.number() }).nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
})

export type QuoteRequest = z.infer<typeof quoteRequest>
export type QuoteLine = z.infer<typeof quoteLine>
export type Quote = z.infer<typeof quote>
export type QuoteChange = (typeof changeKinds)[number]

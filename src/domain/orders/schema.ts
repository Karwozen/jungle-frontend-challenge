import { z } from 'zod'
import { cartLine } from '@/domain/cart/schema'
import { networks } from '@/domain/catalog/schema'
import { ethAmount, image, isoDate } from '@/domain/common/schema'
import { walletProviders } from '@/domain/wallets/schema'

export const orderStatuses = ['pending', 'confirmed', 'refused'] as const

export const createOrderRequest = z.object({
  quoteId: z.string(),
  walletId: z.string(),
  network: z.enum(networks),
  note: z.string().trim().max(280, 'Use no máximo 280 caracteres').optional(),
})

export const orderItem = cartLine.extend({
  name: z.string(),
  image,
  unitPrice: ethAmount,
  total: ethAmount,
})

export const order = z.object({
  id: z.string(),
  status: z.enum(orderStatuses),
  version: z.number().int().positive(),
  createdAt: isoDate,
  updatedAt: isoDate,
  items: z.array(orderItem),
  coupon: z.object({ code: z.string(), percent: z.number() }).nullable(),
  subtotal: ethAmount,
  discount: ethAmount,
  networkFee: ethAmount,
  total: ethAmount,
  network: z.enum(networks),
  wallet: z.object({
    displayName: z.string(),
    provider: z.enum(walletProviders),
    address: z.string(),
  }),
  note: z.string().nullable(),
  txHash: z.string().nullable(),
  explorerUrl: z.string().nullable(),
  failureReason: z.string().nullable(),
})

export type CreateOrderRequest = z.infer<typeof createOrderRequest>
export type OrderItem = z.infer<typeof orderItem>
export type Order = z.infer<typeof order>
export type OrderStatus = (typeof orderStatuses)[number]

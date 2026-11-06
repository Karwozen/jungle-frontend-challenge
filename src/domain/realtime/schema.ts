import { z } from 'zod'
import { ethAmount, isoDate } from '@/domain/common/schema'
import { orderStatuses } from '@/domain/orders/schema'

export const NFT_UPDATED = 'nft.updated'
export const ORDER_UPDATED = 'order.updated'

const envelope = {
  id: z.string(),
  version: z.number().int().nonnegative(),
  occurredAt: isoDate,
}

export const nftUpdatedEvent = z.object({
  ...envelope,
  type: z.literal(NFT_UPDATED),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  data: z.object({
    price: ethAmount,
    previousPrice: ethAmount.nullable(),
    soldOut: z.boolean(),
    editions: z.array(
      z.object({
        id: z.string(),
        price: ethAmount,
        available: z.number().int().nonnegative().nullable(),
      }),
    ),
  }),
})

export const orderUpdatedEvent = z.object({
  ...envelope,
  type: z.literal(ORDER_UPDATED),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  data: z.object({
    status: z.enum(orderStatuses),
    txHash: z.string().nullable(),
    explorerUrl: z.string().nullable(),
    failureReason: z.string().nullable(),
  }),
})

export const realtimeEvent = z.discriminatedUnion('type', [nftUpdatedEvent, orderUpdatedEvent])

export type NftUpdatedEvent = z.infer<typeof nftUpdatedEvent>
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEvent>
export type RealtimeEvent = z.infer<typeof realtimeEvent>

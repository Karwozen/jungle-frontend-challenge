import { z } from 'zod'
import { ethAmount, image } from '@/domain/common/schema'

export const cartLine = z.object({
  nftId: z.string(),
  editionId: z.string(),
  quantity: z.number().int().positive(),
})

export const cartItem = cartLine.extend({
  id: z.string(),
  name: z.string(),
  image,
  unitPrice: ethAmount,
  addedPrice: ethAmount,
  available: z.number().int().nonnegative().nullable(),
  maxQuantity: z.number().int().nonnegative(),
})

export const cart = z.object({
  items: z.array(cartItem),
  coupon: z.string().nullable(),
})

export const updateCartItemRequest = z.object({ quantity: z.number().int().positive() })

export const mergeCartRequest = z.object({ items: z.array(cartLine).max(50) })

export const couponRequest = z.object({ code: z.string().trim().min(1, 'Informe o cupom') })

export type CartLine = z.infer<typeof cartLine>
export type CartItem = z.infer<typeof cartItem>
export type Cart = z.infer<typeof cart>

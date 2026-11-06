import { http, HttpResponse } from 'msw'
import {
  cart,
  cartLine,
  couponRequest,
  mergeCartRequest,
  updateCartItemRequest,
  type Cart,
} from '@/domain/cart/schema'
import type { Edition } from '@/domain/catalog/schema'
import { requireSession } from '@/mocks/auth'
import { getDb, saveDb, type StoredCart } from '@/mocks/db'
import { findCoupon, findEdition } from '@/mocks/quote'
import { apiError, notFound, validationError } from '@/mocks/responses'
import { simulate } from '@/mocks/scenarios'

function userCart(userId: string): StoredCart {
  const carts = getDb().carts
  return (carts[userId] ??= { items: [], coupon: null })
}

function view(userId: string): Cart {
  const { items, coupon } = userCart(userId)
  const lines = items.flatMap((record) => {
    const found = findEdition(record.nftId, record.editionId)
    if (!found) return []
    const { nft, edition } = found
    return [
      {
        ...record,
        name: nft.name,
        image: nft.image,
        unitPrice: edition.price,
        available: edition.available,
        maxQuantity: edition.available ?? nft.maxPerOrder,
      },
    ]
  })
  return cart.parse({ items: lines, coupon })
}

function limitError(quantity: number, edition: Edition, maxPerOrder: number) {
  if (edition.available === 0) {
    return apiError(409, 'SOLD_OUT', 'Esta edição está esgotada.')
  }
  if (edition.available === null) {
    if (quantity <= maxPerOrder) return null
    const message = `Máximo de ${maxPerOrder} por pedido`
    return apiError(422, 'VALIDATION', message, { fields: { quantity: message } })
  }
  if (quantity > edition.available) {
    return apiError(409, 'INSUFFICIENT_STOCK', `Só restam ${edition.available} nesta edição.`, {
      details: { available: edition.available },
    })
  }
  return null
}

const newItemId = () => `itm_${crypto.randomUUID().slice(0, 8)}`

export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json(view(auth.user.id))
  }),

  http.post('/api/cart/items', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = cartLine.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { nftId, editionId, quantity } = parsed.data
    const found = findEdition(nftId, editionId)
    if (!found) return notFound('NFT')

    const mine = userCart(auth.user.id)
    const existing = mine.items.find((i) => i.nftId === nftId && i.editionId === editionId)
    const total = quantity + (existing?.quantity ?? 0)

    const error = limitError(total, found.edition, found.nft.maxPerOrder)
    if (error) return error

    if (existing) existing.quantity = total
    else mine.items.push({ id: newItemId(), nftId, editionId, quantity, addedPrice: found.edition.price })
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  http.patch('/api/cart/items/:id', async ({ request, params }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const item = userCart(auth.user.id).items.find((i) => i.id === params.id)
    if (!item) return notFound('Item')

    const parsed = updateCartItemRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const found = findEdition(item.nftId, item.editionId)
    if (!found) return notFound('NFT')

    const error = limitError(parsed.data.quantity, found.edition, found.nft.maxPerOrder)
    if (error) return error

    item.quantity = parsed.data.quantity
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  http.delete('/api/cart/items/:id', async ({ request, params }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const mine = userCart(auth.user.id)
    mine.items = mine.items.filter((i) => i.id !== params.id)
    if (!mine.items.length) mine.coupon = null
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  http.put('/api/cart/coupon', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = couponRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const coupon = findCoupon(parsed.data.code)
    if (coupon instanceof Response) return coupon

    userCart(auth.user.id).coupon = coupon?.code ?? null
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  http.delete('/api/cart/coupon', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    userCart(auth.user.id).coupon = null
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  http.post('/api/cart/acknowledge', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const mine = userCart(auth.user.id)
    for (const item of mine.items) {
      const found = findEdition(item.nftId, item.editionId)
      if (found) item.addedPrice = found.edition.price
    }
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),

  // itens do visitante entram no carrinho do usuário ao autenticar, respeitando os limites
  http.post('/api/cart/merge', async ({ request }) => {
    const failure = await simulate('cart')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = mergeCartRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const mine = userCart(auth.user.id)
    for (const line of parsed.data.items) {
      const found = findEdition(line.nftId, line.editionId)
      if (!found) continue

      const existing = mine.items.find((i) => i.nftId === line.nftId && i.editionId === line.editionId)
      const wanted = line.quantity + (existing?.quantity ?? 0)
      const quantity = Math.min(wanted, found.edition.available ?? found.nft.maxPerOrder)
      if (quantity <= 0) continue

      if (existing) existing.quantity = quantity
      else mine.items.push({ id: newItemId(), ...line, quantity, addedPrice: found.edition.price })
    }
    saveDb()
    return HttpResponse.json(view(auth.user.id))
  }),
]

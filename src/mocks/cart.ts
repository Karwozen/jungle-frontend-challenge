import { http, HttpResponse } from 'msw'
import { resolveCartIdentity } from './account'
import { readDatabase } from './database'
import { parseEth, serializeEth } from '../shared/money'
import { cartItemId, resolveEdition } from '../shared/editions'
import type { Cart } from '../shared/cart'
const KEY = 'kurio.mock.carts.v1'
interface StoredCart { items: Record<string, number>; coupon: string }
const empty = (): StoredCart => ({ items: {}, coupon: '' })
export function resetCarts() { localStorage.removeItem(KEY) }
const failure = (message: string, status = 409, code = 'AVAILABILITY_CONFLICT') => HttpResponse.json({ message, code }, { status })
export async function context(request: Request) {
  const identity = await resolveCartIdentity(request)
  if (!identity) return null
  const carts: Record<string, StoredCart> = JSON.parse(localStorage.getItem(KEY) || '{}')
  const cart = carts[identity.owner] ??= empty()
  if (identity.owner !== identity.guest && carts[identity.guest]) {
    const guest = carts[identity.guest]
    for (const [id, quantity] of Object.entries(guest.items)) cart.items[id] = (cart.items[id] || 0) + quantity
    cart.coupon ||= guest.coupon
    delete carts[identity.guest]
  }
  const save = () => localStorage.setItem(KEY, JSON.stringify(carts))
  save()
  return { cart, save }
}
export function snapshot(cart: StoredCart): Cart {
  const catalog = readDatabase().nfts
  const items = Object.entries(cart.items).flatMap(([id, quantity]) => { const [nftId, editionId] = id.split('~'); const nft = catalog.find(n => n.id === nftId); const edition = nft && resolveEdition(nft, editionId); return nft && edition ? [{ id, nft: { ...nft, price: edition.price, available: edition.available }, edition, quantity }] : [] })
  const subtotal = items.reduce((total, item) => total + parseEth(item.nft.price) * BigInt(item.quantity), 0n)
  const discount = cart.coupon ? subtotal / 10n : 0n
  const networkFee = items.length ? parseEth('0.005') : 0n
  return { items, coupon: cart.coupon, subtotal: serializeEth(subtotal), discount: serializeEth(discount), networkFee: serializeEth(networkFee), total: serializeEth(subtotal - discount + networkFee) }
}
const expired = () => failure('Sua sessão expirou. Entre novamente.', 401, 'SESSION_EXPIRED')
export const cartHandlers = [
  http.get('/api/cart', async ({ request }) => { const ctx = await context(request); return ctx ? HttpResponse.json(snapshot(ctx.cart)) : expired() }),
  http.post('/api/cart', async ({ request }) => {
    const ctx = await context(request); if (!ctx) return expired()
    const body = await request.json() as { nftId: string; editionId?: string; quantity: number }
    const nft = readDatabase().nfts.find(n => n.id === body.nftId)
    if (!nft) return failure('NFT não encontrado', 404, 'NOT_FOUND')
    const edition = resolveEdition(nft, body.editionId)
    if (!edition) return failure('Edição não encontrada', 404, 'NOT_FOUND')
    const id = cartItemId(nft.id, edition.id)
    const quantity = (ctx.cart.items[id] || 0) + body.quantity
    if (!Number.isInteger(body.quantity) || body.quantity < 1 || quantity > edition.available) return failure('Quantidade indisponível para este NFT')
    ctx.cart.items[id] = quantity; ctx.save(); return HttpResponse.json(snapshot(ctx.cart))
  }),
  http.patch('/api/cart/:id', async ({ request, params }) => {
    const ctx = await context(request); if (!ctx) return expired()
    const { quantity } = await request.json() as { quantity: number }, id = String(params.id)
    const [nftId, editionId] = id.split('~')
    const nft = readDatabase().nfts.find(n => n.id === nftId)
    const edition = nft && resolveEdition(nft, editionId)
    if (!(id in ctx.cart.items)) return failure('Item não encontrado', 404, 'NOT_FOUND')
    if (!edition || !Number.isInteger(quantity) || quantity < 1 || quantity > edition.available) return failure('Quantidade indisponível para este NFT')
    ctx.cart.items[id] = quantity; ctx.save(); return HttpResponse.json(snapshot(ctx.cart))
  }),
  http.delete('/api/cart/:id', async ({ request, params }) => { const ctx = await context(request); if (!ctx) return expired(); delete ctx.cart.items[String(params.id)]; ctx.save(); return HttpResponse.json(snapshot(ctx.cart)) }),
  http.post('/api/cart-coupon', async ({ request }) => {
    const ctx = await context(request); if (!ctx) return expired()
    const { code } = await request.json() as { code: unknown }
    if (typeof code !== 'string' || code.trim().toUpperCase() !== 'KURIO10') return failure(code === 'EXPIRED' ? 'Cupom expirado' : 'Cupom inválido', 422, 'INVALID_COUPON')
    ctx.cart.coupon = 'KURIO10'; ctx.save(); return HttpResponse.json(snapshot(ctx.cart))
  }),
  http.delete('/api/cart-coupon', async ({ request }) => { const ctx = await context(request); if (!ctx) return expired(); ctx.cart.coupon = ''; ctx.save(); return HttpResponse.json(snapshot(ctx.cart)) }),
]

export function consumePurchased(owner: string, items: Cart['items']) {
  const carts: Record<string, StoredCart> = JSON.parse(localStorage.getItem(KEY) || '{}')
  const cart = carts[owner]
  if (!cart) return
  for (const item of items) { const id = item.id ?? cartItemId(item.nft.id, item.edition?.id); const remaining = (cart.items[id] || 0) - item.quantity; if (remaining > 0) cart.items[id] = remaining; else delete cart.items[id] }
  if (!Object.keys(cart.items).length) cart.coupon = ''
  localStorage.setItem(KEY, JSON.stringify(carts))
}

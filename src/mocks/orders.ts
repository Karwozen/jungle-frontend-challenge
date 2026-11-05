import { http, HttpResponse, delay } from 'msw'
import { resolveEdition } from '../shared/editions'
import { requestUser } from './account'
import { context, snapshot, consumePurchased } from './cart'
import { readDatabase, writeDatabase } from './database'
import type { Order, OrderInput, Quote } from '../shared/orders'
import { collectorSchemaForNetwork } from '../shared/orders'
import type { ResourceEvent } from '../shared/contracts'
const KEY = 'kurio.mock.orders.v1'
interface StoredOrder { order: Order; key: string; fingerprint: string; due: number; decline: boolean }
interface State { quotes: Record<string, Quote & { userId: string }>; orders: StoredOrder[]; scenario: 'success' | 'declined' | 'timeout' }
const read = (): State => JSON.parse(localStorage.getItem(KEY) || '{"quotes":{},"orders":[],"scenario":"success"}')
const write = (state: State) => localStorage.setItem(KEY, JSON.stringify(state))
export const resetOrders = () => localStorage.removeItem(KEY)
export const orderListeners = new Set<{ userId: string; orderId: string; valid: () => Promise<boolean>; emit: (event: ResourceEvent<Order>) => void }>()
export const nftListeners = new Set<(event: ResourceEvent<import('../shared/contracts').Nft>) => void>()
const fail = (message: string, status = 409, code = 'CONFLICT') => HttpResponse.json({ message, code }, { status })
function settle(id: string) {
  const state = read(), stored = state.orders.find(item => item.order.id === id)
  if (!stored || stored.order.status !== 'pending' || stored.due > Date.now()) return
  const order = stored.order, db = readDatabase()
  const available = order.cart.items.every(item => { const nft = db.nfts.find(n => n.id === item.nft.id); const edition = nft && resolveEdition(nft, item.edition?.id); return edition && edition.available >= item.quantity })
  order.status = stored.decline || !available ? 'declined' : 'confirmed'; order.version++
  if (order.status === 'confirmed') {
    order.transaction = '0x' + crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '')
    for (const item of order.cart.items) { const nft = db.nfts.find(n => n.id === item.nft.id)!; const edition = nft.editions.find(edition => edition.id === (item.edition?.id || 'standard'))!; edition.available -= item.quantity; if (edition.id === 'standard') { nft.available -= item.quantity; edition.available = nft.available } nft.version++ }
    writeDatabase(db); consumePurchased('user:' + order.userId, order.cart.items)
  } else order.reason = available ? 'Pagamento recusado na simulação. Seu carrinho foi preservado.' : 'Disponibilidade insuficiente. Seu carrinho foi preservado.'
  write(state)
  for (const listener of orderListeners) if (listener.orderId === id && listener.userId === order.userId) void listener.valid().then(valid => { if (valid) listener.emit({ eventId: crypto.randomUUID(), resourceId: id, version: order.version, data: order }) })
  if (order.status === 'confirmed') for (const item of order.cart.items) { const nft = db.nfts.find(n => n.id === item.nft.id)!; for (const emit of nftListeners) emit({ eventId: crypto.randomUUID(), resourceId: nft.id, version: nft.version, data: nft }) }
}
export const orderHandlers = [
  http.post('/api/quotes', async ({ request }) => {
    const user = await requestUser(request); if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const ctx = await context(request); if (!ctx) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const cart = snapshot(ctx.cart)
    if (!cart.items.length || cart.items.some(item => item.quantity > item.nft.available)) return fail('Revise a disponibilidade no carrinho')
    const quote = { id: crypto.randomUUID(), cart, expiresAt: Date.now() + 120000, userId: user.id }, state = read()
    state.quotes[quote.id] = quote; write(state); return HttpResponse.json(quote)
  }),
  http.post('/api/orders', async ({ request }) => {
    const input = await request.json() as OrderInput
    const user = await requestUser(request); if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const ctx = await context(request); if (!ctx) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const state = read(), key = request.headers.get('Idempotency-Key'), fingerprint = JSON.stringify(input)
    if (!key) return fail('Chave de idempotência obrigatória', 422, 'VALIDATION')
    const existing = state.orders.find(item => item.order.userId === user.id && item.key === key)
    if (existing) { if (existing.fingerprint !== fingerprint) return fail('Chave já utilizada com outros dados'); settle(existing.order.id); return HttpResponse.json(read().orders.find(item => item.order.id === existing.order.id)!.order) }
    const quote = state.quotes[input.quoteId], wallet = user.wallets?.find(w => w.id === input.walletId && w.network === input.network)
    const collector = collectorSchemaForNetwork(input.network).safeParse(input)
    if (!collector.success) return HttpResponse.json({ message: 'Revise os dados do colecionador', code: 'VALIDATION', fields: Object.fromEntries(collector.error.issues.map(issue => [issue.path[0], issue.message])) }, { status: 422 })
    if (!wallet || !input.accepted || typeof input.name !== 'string' || input.name.trim().length < 2 || typeof input.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return fail('Revise os dados e a carteira', 422, 'VALIDATION')
    const current = snapshot(ctx.cart)
    if (!quote || quote.userId !== user.id || quote.expiresAt <= Date.now() || JSON.stringify(quote.cart) !== JSON.stringify(current)) return fail('A cotação mudou ou expirou. Revise os valores e confirme novamente.', 409, 'QUOTE_CHANGED')
    if (current.items.some(item => item.nft.network !== input.network)) return fail('A rede selecionada não corresponde à rede de todos os NFTs do carrinho.', 409, 'NETWORK_MISMATCH')
    if (current.items.some(item => item.quantity > item.nft.available)) return fail('Quantidade indisponível')
    const order: Order = { id: crypto.randomUUID(), userId: user.id, status: 'pending', version: 1, cart: quote.cart, wallet: { ...wallet }, collector: { name: input.name, email: input.email, ...collector.data }, createdAt: Date.now() }
    const timeout = state.scenario === 'timeout'
    state.orders.push({ order, key, fingerprint, due: Date.now() + 2500, decline: state.scenario === 'declined' }); write(state)
    setTimeout(() => settle(order.id), 2600)
    if (timeout) { await delay(13000); return HttpResponse.error() }
    return HttpResponse.json(order, { status: 201 })
  }),
  http.get('/api/orders/:id', async ({ request, params }) => {
    const user = await requestUser(request); if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const id = String(params.id), stored = read().orders.find(item => item.order.id === id && item.order.userId === user.id)
    if (!stored) return fail('Pedido não encontrado', 404, 'NOT_FOUND')
    settle(id); return HttpResponse.json(read().orders.find(item => item.order.id === id)!.order)
  }),
  http.post('/api/demo/payment-scenario', async ({ request }) => { const { scenario } = await request.json() as { scenario: State['scenario'] }; if (!['success','declined','timeout'].includes(scenario)) return fail('Cenário inválido', 422); const state = read(); state.scenario = scenario; write(state); return HttpResponse.json({ ok: true }) }),
]

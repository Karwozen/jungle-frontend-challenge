import { z } from 'zod'
import { resetNetwork } from './network'
import { http, HttpResponse, ws, delay } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { readDatabase, writeDatabase, resetDatabase } from './database'
import { serializeEth, parseEth } from '../shared/money'
import type { ResourceEvent, Nft } from '../shared/contracts'
import { catalogSearch } from '../shared/catalog'
import { resetAccounts } from './account'
import { resetCarts } from './cart'

import { resetOrders, orderListeners, nftListeners } from './orders'
import { requestUser } from './account'
import { resetFavorites } from './favorites'
import { resolveEdition } from '../shared/editions'

// MSW normalizes the default /socket.io/ path to the origin for matching.
const socket = ws.link('wss://realtime.kurio.test')
const clients = new Set<{ emit(event: string, data: unknown): void }>()
const connections = new Set<() => void>()
let connectionCount = 0
let socketPausedUntil = 0
let lastNftEvent: ResourceEvent<Nft> | undefined
export const handlers = [
  http.get('/api/demo/realtime-status', () => HttpResponse.json({ connectedClients: clients.size, connectionCount })),
  http.post('/api/demo/socket-disconnect', async ({ request }) => {
    const text = await request.text()
    let input: unknown
    try { input = text ? JSON.parse(text) : {} } catch { return HttpResponse.json({ message: 'Cenário inválido' }, { status: 422 }) }
    const parsed = z.object({ pauseMs: z.number().int().min(0).max(10000).default(0) }).safeParse(input)
    if (!parsed.success) return HttpResponse.json({ message: 'Cenário inválido' }, { status: 422 })
    socketPausedUntil = Date.now() + parsed.data.pauseMs
    for (const close of [...connections]) close()
    return HttpResponse.json({ ok: true })
  }),
  socket.addEventListener('connection', (connection) => {
    const { client } = toSocketIo(connection)
    if (Date.now() < socketPausedUntil) { setTimeout(() => connection.client.close(4000, 'Simulated interruption'), 0); return }
    clients.add(client)
    connectionCount++
    const close = () => connection.client.close(4000, 'Simulated interruption')
    connections.add(close)
    const emitNft = (event: ResourceEvent<Nft>) => client.emit('nft.updated', event)
    nftListeners.add(emitNft)
    let subscription: Parameters<typeof orderListeners.add>[0] | undefined
    client.on('order.subscribe', async (_event, data: { token: string; orderId: string }) => {
      const authRequest = new Request(location.origin + '/api/session', { headers: { Authorization: 'Bearer ' + data.token } })
      const user = await requestUser(authRequest)
      if (!user) return
      if (subscription) orderListeners.delete(subscription)
      subscription = { userId: user.id, orderId: data.orderId, valid: async () => Boolean(await requestUser(authRequest)), emit: event => client.emit('order.updated', event) }
      orderListeners.add(subscription)
    })
    // Published binding handles the initial handshake; keep Engine.IO alive.
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => { clearInterval(heartbeat); connections.delete(close); clients.delete(client); nftListeners.delete(emitNft); if (subscription) orderListeners.delete(subscription) })
  }),
  http.get('/api/nfts', async ({ request }) => {
    await delay(350)
    const url = new URL(request.url)
    const params = catalogSearch.parse(Object.fromEntries(url.searchParams))
    const search = params.q.toLocaleLowerCase('pt-BR')
    const items = readDatabase().nfts.filter(nft => nft.name.toLocaleLowerCase('pt-BR').includes(search) && (!params.collection || nft.collection === params.collection) && (!params.network || nft.network === params.network) && (!params.minPrice || parseEth(nft.price) >= parseEth(params.minPrice)) && (!params.maxPrice || parseEth(nft.price) <= parseEth(params.maxPrice)))
    if (params.sort !== 'recent') items.sort((a, b) => {
      const first = parseEth(a.price), second = parseEth(b.price)
      const comparison = first < second ? -1 : first > second ? 1 : a.id.localeCompare(b.id)
      return params.sort === 'price-desc' ? -comparison : comparison
    })
    const pageSize = 9
    return HttpResponse.json({ items: items.slice((params.page - 1) * pageSize, params.page * pageSize), total: items.length, page: params.page, pageSize })
  }),
  http.get('/api/nfts/:id', ({ params }) => {
    const nft = readDatabase().nfts.find(nft => nft.id === params.id)
    return nft ? HttpResponse.json(nft) : HttpResponse.json({ code: 'NOT_FOUND', message: 'NFT não encontrado' }, { status: 404 })
  }),
  http.post('/api/demo/reset', async () => { socketPausedUntil = 0; lastNftEvent = undefined; resetNetwork(); resetDatabase(); resetCarts(); resetOrders(); resetFavorites(); await resetAccounts(); return HttpResponse.json({ ok: true }) }),
  http.post('/api/demo/edition-update', async ({ request }) => {
    const input = await request.json() as { nftId: string; editionId: string; price?: string; available?: number }
    const db = readDatabase(), nft = db.nfts.find(item => item.id === input.nftId)
    const edition = nft?.editions.find(item => item.id === input.editionId)
    if (!nft || !edition) return HttpResponse.json({ code: 'NOT_FOUND', message: 'Edição não encontrada' }, { status: 404 })
    if ((input.price !== undefined && (typeof input.price !== 'string' || !/^\d+(\.\d{1,18})?$/.test(input.price))) || (input.available !== undefined && (!Number.isSafeInteger(input.available) || input.available < 0))) return HttpResponse.json({ code: 'VALIDATION', message: 'Preço ou disponibilidade inválidos' }, { status: 422 })
    const current = resolveEdition(nft, edition.id)!
    edition.price = input.price ?? current.price
    edition.available = input.available ?? current.available
    if (edition.id === 'standard') { nft.price = edition.price; nft.available = edition.available }
    nft.version++
    writeDatabase(db)
    const event: ResourceEvent<Nft> = { eventId: crypto.randomUUID(), resourceId: nft.id, version: nft.version, data: nft }
    for (const client of clients) client.emit('nft.updated', event)
    return HttpResponse.json(nft)
  }),
  http.post('/api/demo/replay-nft-event', async ({ request }) => {
    const parsed = z.object({ mode: z.enum(['duplicate', 'older']) }).safeParse(await request.json().catch(() => null))
    if (!parsed.success || !lastNftEvent) return HttpResponse.json({ message: 'Evento indisponível' }, { status: 422 })
    const event = parsed.data.mode === 'duplicate' ? lastNftEvent : { ...lastNftEvent, eventId: crypto.randomUUID(), version: lastNftEvent.version - 1, data: { ...lastNftEvent.data, version: lastNftEvent.version - 1, price: '0.01' } }
    for (const client of clients) client.emit('nft.updated', event)
    return HttpResponse.json({ eventId: event.eventId, version: event.version, connectedClients: clients.size })
  }),
  http.post('/api/demo/nft-update', () => {
    const db = readDatabase()
    const nft = db.nfts[0]
    nft.price = serializeEth(parseEth(nft.price) + parseEth('0.05'))
    const standard = nft.editions.find(edition => edition.id === 'standard')
    if (standard) standard.price = nft.price
    nft.version += 1
    writeDatabase(db)
    const event: ResourceEvent<Nft> = { eventId: crypto.randomUUID(), resourceId: nft.id, version: nft.version, data: nft }
    lastNftEvent = structuredClone(event)
    for (const client of clients) client.emit('nft.updated', event)
    return HttpResponse.json({ eventId: event.eventId, connectedClients: clients.size })
  }),
]

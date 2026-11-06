import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { ethAmount } from '@/domain/common/schema'
import { order } from '@/domain/orders/schema'
import { getDb, resetDb } from '@/mocks/db'
import { repriceNft, touchNft } from '@/mocks/nfts'
import { settleOrder } from '@/mocks/orders'
import { disconnectAll, listEvents, replayEvent, resetRealtime } from '@/mocks/realtime'
import { notFound, validationError } from '@/mocks/responses'
import { endpoints, scenarios, setScenario } from '@/mocks/scenarios'

// rotas de apoio para demonstração e testes, sem sessão nem cenário de falha
const scenarioBody = z.object({
  name: z.enum(scenarios),
  on: z.array(z.enum(endpoints)).default([]),
})

const nftBody = z.object({
  price: ethAmount.refine((value) => Number(value) > 0, 'Informe um preço maior que zero').optional(),
  stock: z.record(z.string(), z.number().int().nonnegative().nullable()).optional(),
})

const settleBody = z.object({ outcome: z.enum(['confirmed', 'refused']).optional() })

const replayBody = z.object({ eventId: z.string() })

export const controlHandlers = [
  http.post('/api/__mock/reset', () => {
    resetDb()
    resetRealtime()
    setScenario('default')
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('/api/__mock/scenario', async ({ request }) => {
    const parsed = scenarioBody.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    setScenario(parsed.data.name, parsed.data.on)
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/__mock/nfts/:id', async ({ request, params }) => {
    const nft = getDb().nfts.find((n) => n.id === params.id)
    if (!nft) return notFound('NFT')

    const parsed = nftBody.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { price, stock } = parsed.data
    for (const edition of nft.editions) {
      if (stock && edition.id in stock) edition.available = stock[edition.id]
    }
    if (price) repriceNft(nft, price)
    else touchNft(nft)
    return HttpResponse.json({ id: nft.id, version: nft.version })
  }),

  http.post('/api/__mock/orders/:id/settle', async ({ request, params }) => {
    const found = getDb().orders.find((o) => o.id === params.id)
    if (!found) return notFound('Pedido')

    const parsed = settleBody.safeParse(await request.json().catch(() => ({})))
    if (!parsed.success) return validationError(parsed.error)

    settleOrder(found, parsed.data.outcome)
    return HttpResponse.json(order.parse(found))
  }),

  http.get('/api/__mock/events', () => HttpResponse.json(listEvents())),

  http.post('/api/__mock/events/replay', async ({ request }) => {
    const parsed = replayBody.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    return replayEvent(parsed.data.eventId)
      ? new HttpResponse(null, { status: 204 })
      : notFound('Evento')
  }),

  http.post('/api/__mock/socket/disconnect', () =>
    HttpResponse.json({ closed: disconnectAll() }),
  ),
]

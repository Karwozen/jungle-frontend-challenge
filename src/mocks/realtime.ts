import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { Nft } from '@/domain/catalog/schema'
import {
  NFT_UPDATED,
  ORDER_UPDATED,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
  type RealtimeEvent,
} from '@/domain/realtime/schema'
import { getDb, type OrderRecord } from '@/mocks/db'
import { socketUrl } from '@/lib/socket-url'
import { getScenario } from '@/mocks/scenarios'

const PING_INTERVAL_MS = 20_000
const HISTORY_SIZE = 100

interface Client {
  token: string | null
  userId: string | null
  emit: (event: RealtimeEvent) => void
  close: () => void
}

interface Sent {
  event: RealtimeEvent
  // null: público; senão só chega às conexões desse usuário
  userId: string | null
}

const clients = new Set<Client>()
let history: Sent[] = []

// o MSW compara só a origem: o prefixo /socket.io/ do cliente é descartado antes
const realtime = ws.link(socketUrl)

function userFromToken(token: string | null) {
  const session = getDb().sessions.find((s) => s.token === token)
  return session && Date.parse(session.expiresAt) > Date.now() ? session.userId : null
}

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    if (getScenario('socket') === 'socket-offline') {
      connection.client.close(1011, 'Servidor indisponível')
      return
    }

    const io = toSocketIo(connection)
    const token = connection.client.url.searchParams.get('token')
    const client: Client = {
      token,
      userId: userFromToken(token),
      emit: (event) => io.client.emit(event.type, event),
      close: () => connection.client.close(1001, 'Conexão encerrada pelo servidor'),
    }
    clients.add(client)

    // Envia pacotes de ping periódicos do Engine.IO para manter a conexão ativa no cliente
    const ping = setInterval(() => connection.client.send('2'), PING_INTERVAL_MS)
    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      clients.delete(client)
    })
  }),
]

// Verifica a validade da sessão antes de entregar eventos privados de pedido ao socket conectado
function canReceive(client: Client, sent: Sent) {
  if (sent.userId === null) return true
  return client.userId === sent.userId && userFromToken(client.token) === sent.userId
}

function send(sent: Sent) {
  for (const client of clients) {
    if (canReceive(client, sent)) client.emit(sent.event)
  }
}

function publish(event: RealtimeEvent, userId: string | null) {
  const sent = { event, userId }
  history = [...history, sent].slice(-HISTORY_SIZE)
  send(sent)
  return event
}

const eventId = () => `evt_${crypto.randomUUID().slice(0, 8)}`

export function publishNft(nft: Nft) {
  const event: NftUpdatedEvent = {
    id: eventId(),
    type: NFT_UPDATED,
    resource: { type: 'nft', id: nft.id },
    version: nft.version,
    occurredAt: new Date().toISOString(),
    data: {
      price: nft.price,
      previousPrice: nft.previousPrice,
      soldOut: nft.soldOut,
      editions: nft.editions.map(({ id, price, available }) => ({ id, price, available })),
    },
  }
  return publish(event, null)
}

export function publishOrder(order: OrderRecord) {
  const event: OrderUpdatedEvent = {
    id: eventId(),
    type: ORDER_UPDATED,
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: order.updatedAt,
    data: {
      status: order.status,
      txHash: order.txHash,
      explorerUrl: order.explorerUrl,
      failureReason: order.failureReason,
    },
  }
  return publish(event, order.userId)
}

// Reemite um evento do histórico para exercitar a proteção contra duplicatas e versões obsoletas
export function replayEvent(id: string) {
  const sent = history.find((s) => s.event.id === id)
  if (sent) send(sent)
  return sent?.event
}

export function listEvents() {
  return history.map(({ event }) => ({
    id: event.id,
    type: event.type,
    resource: event.resource,
    version: event.version,
  }))
}

export function disconnectAll() {
  const count = clients.size
  for (const client of clients) client.close()
  return count
}

export function resetRealtime() {
  history = []
}

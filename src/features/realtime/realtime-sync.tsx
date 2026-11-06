import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { cartKey } from '@/domain/cart/queries'
import { catalogKeys } from '@/domain/catalog/queries'
import type { Nft } from '@/domain/catalog/schema'
import { ordersKey } from '@/domain/orders/queries'
import { useSession } from '@/features/auth/use-session'
import { formatEth } from '@/lib/eth'
import { getToken } from '@/lib/session-token'
import { announce } from './announcer'
import { applyNftUpdated, applyOrderUpdated } from './apply-events'
import { EventGuard } from './event-guard'
import { createSocket } from './socket'

// Mantém uma conexão Socket.IO por sessão e reinicia o guard de eventos quando o usuário muda
function RealtimeSync() {
  const queryClient = useQueryClient()
  const { data: session, isPending } = useSession()
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (isPending) return

    const guard = new EventGuard()
    let socket: Socket | undefined
    let closed = false
    let connectedOnce = false

    const listen = (io: Socket) => {
      io.on('connect', () => {
        document.documentElement.dataset.realtime = 'connected'
        // Ao restabelecer a conexão após queda, revalida os dados via REST para sincronizar possíveis eventos perdidos
        if (connectedOnce) {
          queryClient.invalidateQueries({ queryKey: catalogKeys.all })
          queryClient.invalidateQueries({ queryKey: ['quote'] })
          if (userId) {
            queryClient.invalidateQueries({ queryKey: cartKey(userId) })
            queryClient.invalidateQueries({ queryKey: ordersKey(userId) })
          }
          announce('Conexão em tempo real restabelecida.')
        }
        connectedOnce = true
      })
      io.on('disconnect', () => {
        document.documentElement.dataset.realtime = 'disconnected'
        announce('Conexão em tempo real perdida. Tentando reconectar.')
      })

      io.on('nft.updated', (event) => {
        if (!guard.accept(event)) return
        if (!applyNftUpdated(queryClient, event, userId)) return

        const name = queryClient.getQueryData<Nft>(catalogKeys.detail(event.resource.id))?.name ?? 'Um NFT do seu carrinho'
        const text = event.data.soldOut
          ? `${name} esgotou. Revise o carrinho.`
          : `O preço de ${name} agora é ${formatEth(event.data.price)}. O resumo foi atualizado.`
        toast.info(text)
        announce(text)
      })

      io.on('order.updated', (event) => {
        if (!userId || !guard.accept(event)) return
        if (!applyOrderUpdated(queryClient, event, userId)) return
        announce(event.data.status === 'confirmed' ? 'Pedido confirmado.' : 'Pedido recusado.')
      })
    }

    createSocket(userId ? getToken() : null).then((io) => {
      if (closed) {
        io.disconnect()
        return
      }
      socket = io
      listen(io)
    })

    return () => {
      closed = true
      delete document.documentElement.dataset.realtime
      socket?.removeAllListeners()
      socket?.disconnect()
      guard.clear()
    }
  }, [isPending, userId, queryClient])

  return null
}

export default RealtimeSync

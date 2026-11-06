import type { Socket } from 'socket.io-client'
import { socketUrl } from '@/lib/socket-url'

// Importação dinâmica para garantir que o cliente use o WebSocket já interceptado pelo MSW
// Força o transporte WebSocket puro para compatibilidade com o binding do MSW
// (o transporte HTTP long-polling padrão não é interceptado pelo binding WebSocket)
export async function createSocket(token: string | null): Promise<Socket> {
  const { io } = await import('socket.io-client')
  return io(socketUrl, {
    transports: ['websocket'],
    query: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3_000,
  })
}

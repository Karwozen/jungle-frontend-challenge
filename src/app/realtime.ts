import { io } from 'socket.io-client'
export function createSocket() {
  return io('https://realtime.kurio.test', { transports: ['websocket'], autoConnect: false, reconnectionDelay: 500, reconnectionDelayMax: 5000 })
}

// endereço fictício: o MSW intercepta o WebSocket desse host, sem pegar o do HMR do Vite
export const socketUrl = (import.meta.env.VITE_SOCKET_URL ?? 'wss://realtime.kurio.mock').replace(/\/$/, '')

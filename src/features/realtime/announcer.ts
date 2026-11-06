import { useSyncExternalStore } from 'react'

let message = ''
const listeners = new Set<() => void>()

// o texto muda a cada chamada, mesmo repetido, para o leitor de tela anunciar de novo
export function announce(text: string) {
  message = message === text ? `${text} ` : text
  listeners.forEach((listener) => listener())
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useAnnouncement = () => useSyncExternalStore(subscribe, () => message)

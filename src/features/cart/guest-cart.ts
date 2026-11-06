import { useSyncExternalStore } from 'react'
import { mergeCart } from '@/domain/cart/api'
import type { CartLine } from '@/domain/cart/schema'
import { storage } from '@/lib/storage'

const KEY = 'kurio.guest-cart'
const listeners = new Set<() => void>()

function read(): CartLine[] {
  try {
    return JSON.parse(storage.get(KEY) ?? '[]') as CartLine[]
  } catch {
    return []
  }
}

let lines = read()

function write(next: CartLine[]) {
  lines = next
  storage.set(KEY, JSON.stringify(next))
  listeners.forEach((listener) => listener())
}

type LineKey = Pick<CartLine, 'nftId' | 'editionId'>

const same = (a: LineKey, b: LineKey) => a.nftId === b.nftId && a.editionId === b.editionId

export const guestCart = {
  get: () => lines,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => void listeners.delete(listener)
  },
  add(line: CartLine) {
    const existing = lines.find((l) => same(l, line))
    write(
      existing
        ? lines.map((l) => (l === existing ? { ...l, quantity: l.quantity + line.quantity } : l))
        : [...lines, line],
    )
  },
  setQuantity(line: LineKey, quantity: number) {
    write(lines.map((l) => (same(l, line) ? { ...l, quantity } : l)))
  },
  remove(line: LineKey) {
    write(lines.filter((l) => !same(l, line)))
  },
  clear: () => write([]),
}

export const useGuestCart = () => useSyncExternalStore(guestCart.subscribe, guestCart.get)

// Transfere os itens salvos localmente para a conta do usuário respeitando o limite de estoque no servidor
export async function mergeGuestCart() {
  if (!lines.length) return
  await mergeCart(lines)
  guestCart.clear()
}

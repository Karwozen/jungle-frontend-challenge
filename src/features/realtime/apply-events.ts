import type { QueryClient } from '@tanstack/react-query'
import { cartKey } from '@/domain/cart/queries'
import type { Cart } from '@/domain/cart/schema'
import { catalogKeys } from '@/domain/catalog/queries'
import type { CatalogPage, FeaturedItem, Nft, NftSummary } from '@/domain/catalog/schema'
import { orderKey, ordersKey } from '@/domain/orders/queries'
import type { Order } from '@/domain/orders/schema'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/domain/realtime/schema'
import { guestCart } from '@/features/cart/guest-cart'

function patchSummary<T extends NftSummary>(item: T, event: NftUpdatedEvent): T {
  if (item.id !== event.resource.id || event.version <= item.version) return item
  const { price, previousPrice, soldOut } = event.data
  return { ...item, price, previousPrice, soldOut, version: event.version }
}

// Atualiza o cache do catálogo imediatamente e invalida carrinho/cotação caso o item afetado esteja na sacola
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent, userId: string | null) {
  const id = event.resource.id

  queryClient.setQueryData<Nft>(catalogKeys.detail(id), (old) => {
    if (!old || event.version <= old.version) return old
    const editions = new Map(event.data.editions.map((e) => [e.id, e]))
    return { ...patchSummary(old, event), editions: old.editions.map((e) => ({ ...e, ...editions.get(e.id) })) }
  })
  queryClient.setQueriesData<CatalogPage>(
    { queryKey: ['catalog', 'list'] },
    (old) => old && { ...old, items: old.items.map((item) => patchSummary(item, event)) },
  )
  queryClient.setQueriesData<FeaturedItem[]>({ queryKey: catalogKeys.featured }, (old) =>
    old?.map((item) => ({ ...item, nft: patchSummary(item.nft, event) })),
  )
  queryClient.setQueryData<FeaturedItem>(
    catalogKeys.spotlight,
    (old) => old && { ...old, nft: patchSummary(old.nft, event) },
  )

  const inUserCart = !!userId && !!queryClient.getQueryData<Cart>(cartKey(userId))?.items.some((i) => i.nftId === id)
  const inCart = inUserCart || guestCart.get().some((line) => line.nftId === id)
  if (inCart) {
    if (userId) queryClient.invalidateQueries({ queryKey: cartKey(userId) })
    queryClient.invalidateQueries({ queryKey: ['quote'] })
  }
  return inCart
}

// Estados finais (confirmed ou refused) são imutáveis e não aceitam regressão para pending
export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent, userId: string) {
  const key = orderKey(userId, event.resource.id)
  let applied = false

  queryClient.setQueryData<Order>(key, (old) => {
    if (!old || old.status !== 'pending' || event.version <= old.version) return old
    applied = true
    return { ...old, ...event.data, version: event.version }
  })
  queryClient.invalidateQueries({ queryKey: key })
  queryClient.invalidateQueries({ queryKey: ordersKey(userId) })
  if (event.data.status === 'confirmed') {
    queryClient.invalidateQueries({ queryKey: cartKey(userId) })
    queryClient.invalidateQueries({ queryKey: ['quote'] })
  }
  return applied
}

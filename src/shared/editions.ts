import type { Nft } from './contracts'

// Keep the original identifier for the standard edition, including stored carts.
export const cartItemId = (nftId: string, editionId = 'standard') => editionId === 'standard' ? nftId : `${nftId}~${editionId}`
export function resolveEdition(nft: Nft, editionId = 'standard') {
  const edition = nft.editions.find(item => item.id === editionId)
  // Catalog price/availability are the standard edition's public summary.
  return edition?.id === 'standard' ? { ...edition, price: nft.price, available: nft.available } : edition
}

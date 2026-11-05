import type { Nft, NftEdition } from './contracts'
export interface Cart { items: { id: string; nft: Nft; edition: NftEdition; quantity: number }[]; coupon: string; subtotal: string; discount: string; networkFee: string; total: string }

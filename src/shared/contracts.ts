export interface NftEdition { id: string; name: string; price: string; available: number }
export interface Nft { id: string; name: string; collection: string; category?: string; attributes?: string[]; reviewCount?: number; previousPrice?: string; rare?: boolean; price: string; available: number; version: number; editions: NftEdition[]; network: 'Ethereum' | 'Polygon' | 'Solana'; artwork?: string; gallery?: string[]; description?: string; creator?: string }
export interface ResourceEvent<T> { eventId: string; resourceId: string; version: number; data: T }
export interface CatalogResponse { items: Nft[]; total: number; page: number; pageSize: number; facets?: { categories: Record<string, number>; networks: Record<string, number> } }
export interface ApiError { code: string; message: string; fields?: Record<string, string> }

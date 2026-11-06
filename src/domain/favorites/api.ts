import { http } from '@/lib/http'
import { favorites, type Favorites } from './schema'

export async function getFavorites(signal?: AbortSignal): Promise<Favorites> {
  const { data } = await http.get('/favorites', { signal })
  return favorites.parse(data)
}

export async function addFavorite(nftId: string): Promise<void> {
  await http.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string): Promise<void> {
  await http.delete(`/favorites/${encodeURIComponent(nftId)}`)
}

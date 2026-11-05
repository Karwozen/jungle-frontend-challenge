import { useMutation, useQuery } from '@tanstack/react-query'
import { Heart } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { api } from '../../shared/api'
import { queryClient } from '../../app/query'
import { sessionQuery } from '../account/session'
import { Button } from '../../components/ui/button'

export function FavoriteButton({ nftId }: { nftId: string }) {
  const session = useQuery(sessionQuery)
  const userId = session.data?.user?.id
  const navigate = useNavigate()
  const key = ['private', userId, 'favorites'] as const
  const favorites = useQuery({ queryKey: key, queryFn: async ({ signal }) => (await api.get<string[]>('/favorites', { signal })).data, enabled: Boolean(userId), retry: false })
  const active = Boolean(favorites.data?.includes(nftId))
  const mutation = useMutation({
    mutationFn: async (next: boolean) => (await api.request<string[]>({ url: `/favorites/${encodeURIComponent(nftId)}`, method: next ? 'put' : 'delete' })).data,
    onMutate: async next => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<string[]>(key)
      queryClient.setQueryData<string[]>(key, old => next ? [...new Set([...(old || []), nftId])] : (old || []).filter(id => id !== nftId))
      return { previous }
    },
    onError: (_error, _next, context) => queryClient.setQueryData(key, context?.previous),
    onSuccess: data => queryClient.setQueryData(key, data),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: key }),
  })
  const toggle = () => {
    if (!userId) { void navigate({ to: '/login', search: { returnTo: `/nfts/${nftId}` } }); return }
    mutation.mutate(!active)
  }
  const message = mutation.isError && axios.isAxiosError(mutation.error) ? mutation.error.response?.data?.message : ''
  return <div className="favorite-control"><Button type="button" variant="outline" aria-pressed={active} disabled={mutation.isPending || Boolean(userId && favorites.isPending)} onClick={toggle}><Heart size={17} aria-hidden="true" fill={active ? 'currentColor' : 'none'}/><span className="favorite-label">{active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span></Button>{message && <p role="alert" className="field-error">{message}</p>}</div>
}

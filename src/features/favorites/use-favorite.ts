import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { addFavorite, removeFavorite } from '@/domain/favorites/api'
import { favoritesKey, favoritesQuery } from '@/domain/favorites/queries'
import type { Favorites } from '@/domain/favorites/schema'
import { sessionQuery } from '@/domain/auth/queries'
import { useSession } from '@/features/auth/use-session'
import { withoutAuthParams } from '@/lib/redirect'

export function useFavorite(nftId: string) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const href = useLocation({ select: (location) => location.href })
  const userId = session?.user.id ?? ''

  const { data } = useQuery({ ...favoritesQuery(userId), enabled: !!session })
  const active = !!data?.nftIds.includes(nftId)

  const mutation = useMutation({
    mutationFn: (on: boolean) => (on ? addFavorite(nftId) : removeFavorite(nftId)),
    onMutate: async (on) => {
      await queryClient.cancelQueries({ queryKey: favoritesKey(userId) })
      const previous = queryClient.getQueryData<Favorites>(favoritesKey(userId))
      const ids = (previous?.nftIds ?? []).filter((id) => id !== nftId)
      queryClient.setQueryData<Favorites>(favoritesKey(userId), { nftIds: on ? [...ids, nftId] : ids })
      return { previous }
    },
    onError: (error, _on, context) => {
      queryClient.setQueryData(favoritesKey(userId), context?.previous)
      toast.error(error.message)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: favoritesKey(userId) }),
  })

  const toggle = async () => {
    // Garante que a verificação inicial da sessão terminou antes de exigir login
    const current = session ?? (await queryClient.ensureQueryData(sessionQuery).catch(() => null))
    if (!current) {
      navigate({ to: '.', search: (prev) => ({ ...prev, auth: 'login', redirect: withoutAuthParams(href) }) })
      return
    }
    mutation.mutate(!active)
  }

  return { active, toggle }
}

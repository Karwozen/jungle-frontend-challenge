import { toast } from 'sonner'
import { sessionKey } from '@/domain/auth/queries'
import type { AuthResponse } from '@/domain/auth/schema'
import { mergeGuestCart } from '@/features/cart/guest-cart'
import { queryClient } from '@/lib/query-client'
import { clearToken, setToken } from '@/lib/session-token'

// Remove apenas o cache escopado ao usuário autenticado (['user', id, ...]), preservando o catálogo público
function clearPrivateData() {
  queryClient.cancelQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['user'] })
}

export async function startSession({ token, user, expiresAt }: AuthResponse) {
  setToken(token)
  clearPrivateData()

  // Mescla o carrinho local antes de publicar a sessão para que a leitura inicial já traga os itens combinados
  try {
    await mergeGuestCart()
  } catch {
    toast.warning('Não foi possível juntar os itens do carrinho de visitante.')
  }
  queryClient.setQueryData(sessionKey, { user, expiresAt })
}

export function endSession() {
  clearToken()
  clearPrivateData()
  queryClient.setQueryData(sessionKey, null)
}

import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'
import { getToken } from '@/lib/session-token'

let onSessionLost: (() => void) | undefined

export function setSessionLostHandler(handler: () => void) {
  onSessionLost = handler
}

// Dispara o tratador de perda de sessão apenas quando há um token ativo armazenado
function handleError(error: unknown) {
  if (!(error instanceof ApiError) || !getToken()) return
  if (error.code === 'SESSION_EXPIRED' || error.code === 'UNAUTHENTICATED') onSessionLost?.()
}

// Repete automaticamente apenas falhas transitórias de rede/servidor (até 2 retentativas)
const retry = (failures: number, error: Error) =>
  error instanceof ApiError && error.isTransient && failures < 2

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: handleError }),
  mutationCache: new MutationCache({ onError: handleError }),
  defaultOptions: {
    queries: { staleTime: 30_000, retry, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
})

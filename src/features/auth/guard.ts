import { redirect, type ParsedLocation } from '@tanstack/react-router'
import { sessionQuery } from '@/domain/auth/queries'
import { ApiError } from '@/lib/http'
import { queryClient } from '@/lib/query-client'
import { withoutAuthParams } from '@/lib/redirect'

// Protege rotas autenticadas redirecionando visitantes para a home com o diálogo de login aberto e rota de retorno
export async function requireSession({ location }: { location: ParsedLocation }) {
  // Preserva o indicador de sessão expirada caso tenha sido sinalizado na URL antes da verificação
  let expired = new URLSearchParams(location.searchStr).get('reason') === 'expired'
  const session = await queryClient.ensureQueryData(sessionQuery).catch((error) => {
    expired ||= error instanceof ApiError && error.code === 'SESSION_EXPIRED'
    return null
  })

  if (!session) {
    throw redirect({
      to: '/',
      search: {
        auth: 'login',
        redirect: withoutAuthParams(location.href),
        reason: expired ? 'expired' : undefined,
      },
    })
  }
}

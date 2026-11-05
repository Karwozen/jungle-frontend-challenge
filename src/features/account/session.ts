import axios from 'axios'
import { api, SESSION_TOKEN_KEY } from '../../shared/api'
import type { Session, AuthResponse } from '../../shared/account'
import { queryClient } from '../../app/query'
export async function fetchSession(): Promise<Session> {
  try { return (await api.get<Session>('/session')).data } catch (error) { if (axios.isAxiosError(error) && error.response?.status === 401) return { user: null }; throw error }
}
export const sessionQuery = { queryKey: ['session'] as const, queryFn: fetchSession, retry: false, staleTime: 0 }
export async function clearPrivateData() { await queryClient.cancelQueries(); queryClient.removeQueries({ predicate: query => query.queryKey[0] === 'private' }); queryClient.setQueryData(['session'], { user: null }) }
export async function acceptSession(response: AuthResponse) {
  await clearPrivateData()
  localStorage.setItem(SESSION_TOKEN_KEY, response.token)
  queryClient.setQueryData(['session'], { user: response.user, expiresAt: response.expiresAt })
}

import { http } from '@/lib/http'
import { getToken } from '@/lib/session-token'
import {
  authResponse,
  session,
  type AuthResponse,
  type LoginRequest,
  type Session,
  type SignupRequest,
  type SocialProvider,
} from './schema'

export async function signup(body: SignupRequest): Promise<AuthResponse> {
  const { data } = await http.post('/auth/signup', body)
  return authResponse.parse(data)
}

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await http.post('/auth/login', body)
  return authResponse.parse(data)
}

export async function socialLogin(provider: SocialProvider): Promise<AuthResponse> {
  const { data } = await http.post('/auth/social', { provider })
  return authResponse.parse(data)
}

export async function getSession(signal?: AbortSignal): Promise<Session | null> {
  if (!getToken()) return null
  const { data } = await http.get('/auth/session', { signal })
  return session.parse(data)
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

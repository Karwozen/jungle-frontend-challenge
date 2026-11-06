import type { User } from '@/domain/auth/schema'
import { getDb, saveDb, type StoredSession } from '@/mocks/db'
import type { StoredUser } from '@/mocks/fixtures/users'
import { apiError } from '@/mocks/responses'
import { getScenario, setScenario } from '@/mocks/scenarios'

const SESSION_TTL_MS = 30 * 60_000

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSalt() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function hashPassword(salt: string, password: string) {
  return sha256(`${salt}:${password}`)
}

export async function passwordMatches(user: StoredUser, password: string) {
  return (await hashPassword(user.salt, password)) === user.passwordHash
}

export function publicUser(user: StoredUser): User {
  return { id: user.id, username: user.username, email: user.email, avatar: user.avatar }
}

export function createSession(userId: string): StoredSession {
  const session = {
    token: `tok_${crypto.randomUUID()}`,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  getDb().sessions.push(session)
  saveDb()
  return session
}

export function dropSession(token: string) {
  const db = getDb()
  db.sessions = db.sessions.filter((s) => s.token !== token)
  saveDb()
}

export function expireSession(token: string) {
  const session = getDb().sessions.find((s) => s.token === token)
  if (session) {
    session.expiresAt = new Date(0).toISOString()
    saveDb()
  }
}

function bearer(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

// Valida o token Bearer e retorna o usuário autenticado ou a resposta HTTP de erro correspondente
export function requireSession(request: Request) {
  const token = bearer(request)
  if (!token) return apiError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.')

  const db = getDb()
  const session = db.sessions.find((s) => s.token === token)
  if (!session) return apiError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')

  // Dispara a expiração forçada uma única vez para permitir novo login na sequência
  const forced = getScenario() === 'session-expired'
  if (forced) setScenario('default')

  if (forced || Date.parse(session.expiresAt) <= Date.now()) {
    dropSession(token)
    return apiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }

  const user = db.users.find((u) => u.id === session.userId)
  if (!user) return apiError(401, 'UNAUTHENTICATED', 'Sessão inválida. Entre novamente.')

  return { token, session, user }
}

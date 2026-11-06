import { addressIdentity } from '../shared/networks'
import { z } from 'zod'
import { http, HttpResponse, delay } from 'msw'
import { loginSchema, registerSchema, profileSchema, passwordSchema, walletSchema, type User, type Wallet } from '../shared/account'
const KEY = 'kurio.mock.accounts.v1'
interface StoredUser extends User { hash: string; salt: string; wallets?: Wallet[] }
interface AccountDatabase { users: StoredUser[]; sessions: Record<string, { userId: string; expiresAt: number }> }
let initialization: Promise<void> | undefined
function read(): AccountDatabase { return JSON.parse(localStorage.getItem(KEY)!) as AccountDatabase }
function write(db: AccountDatabase) { localStorage.setItem(KEY, JSON.stringify(db)) }
const publicUser = ({ id, name, email, avatar, username, ens, walletLabel }: StoredUser): User => ({ id, name, email, avatar, username, ens, walletLabel })
async function digest(password: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, '0')).join('')
}
async function initialize() {
  if (!initialization) initialization = (async () => {
    if (localStorage.getItem(KEY)) return
    const users = await Promise.all(['alice', 'bruno'].map(async name => {
      const salt = crypto.randomUUID()
      return { id: name, name: name === 'alice' ? 'Alice Colecionadora' : 'Bruno Colecionador', email: `${name}@kurio.test`, salt, hash: await digest('Kurio2026!', salt) }
    }))
    write({ users, sessions: {} })
  })()
  await initialization
}
function fail(message: string, status: number, code: string, fields?: Record<string, string>) { return HttpResponse.json({ message, code, fields }, { status }) }
export async function resetAccounts() { localStorage.removeItem(KEY); initialization = undefined; await initialize() }
export async function resolveCartIdentity(request: Request) {
  const guest = `guest:${request.headers.get('x-guest-id') || 'anonymous'}`
  if (!request.headers.has('authorization')) return { owner: guest, guest }
  await initialize()
  const { user } = authenticate(request)
  return user ? { owner: `user:${user.id}`, guest } : null
}
function authenticate(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
  const db = read(), session = db.sessions[token]
  const user = session && session.expiresAt > Date.now() ? db.users.find(u => u.id === session.userId) : undefined
  return { token, db, session, user }
}
function issue(db: AccountDatabase, user: StoredUser) {
  const token = crypto.randomUUID(), expiresAt = Date.now() + 30 * 60_000
  db.sessions[token] = { userId: user.id, expiresAt }; write(db)
  return HttpResponse.json({ user: publicUser(user), token, expiresAt })
}
export const accountHandlers = [
  http.post('/api/auth/social', async ({ request }) => {
    await initialize(); await delay(250)
    const input = z.object({ provider: z.enum(['google', 'facebook']) }).safeParse(await request.json())
    if (!input.success) return fail('Provedor inválido', 422, 'VALIDATION')
    const id = `demo-${input.data.provider}`, db = read()
    let user = db.users.find(item => item.id === id)
    if (!user) {
      user = { id, name: `Colecionador ${input.data.provider === 'google' ? 'Google' : 'Facebook'}`, email: `${id}@kurio.test`, salt: crypto.randomUUID(), hash: '' }
      db.users.push(user)
    }
    return issue(db, user)
  }),
  http.post('/api/register', async ({ request }) => {
    await initialize(); await delay(250)
    const input = registerSchema.safeParse(await request.json())
    if (!input.success) return fail('Revise os campos', 422, 'VALIDATION', Object.fromEntries(input.error.issues.map(i => [i.path[0], i.message])))
    const salt = crypto.randomUUID(), hash = await digest(input.data.password, salt)
    const db = read()
    if (db.users.some(u => u.email === input.data.email)) return fail('Este e-mail já possui uma conta', 409, 'CONFLICT', { email: 'Este e-mail já está cadastrado' })
    const user = { id: crypto.randomUUID(), name: input.data.name, email: input.data.email, salt, hash }
    db.users.push(user); return issue(db, user)
  }),
  http.post('/api/login', async ({ request }) => {
    await initialize(); await delay(250)
    const input = loginSchema.safeParse(await request.json())
    if (!input.success) return fail('Revise e-mail e senha', 422, 'VALIDATION')
    const user = read().users.find(u => u.email === input.data.email)
    if (!user || await digest(input.data.password, user.salt) !== user.hash) return fail('E-mail ou senha incorretos', 401, 'INVALID_CREDENTIALS')
    return issue(read(), user)
  }),
  http.get('/api/session', async ({ request }) => {
    if (!request.headers.has('authorization')) return HttpResponse.json({ user: null })
    await initialize()
    const { user, session } = authenticate(request)
    return user ? HttpResponse.json({ user: publicUser(user), expiresAt: session.expiresAt }) : fail('Sua sessão expirou. Entre novamente.', 401, 'SESSION_EXPIRED')
  }),
  http.post('/api/logout', async ({ request }) => { await initialize(); const { db, token } = authenticate(request); delete db.sessions[token]; write(db); return HttpResponse.json({ ok: true }) }),
  http.get('/api/profile', async ({ request }) => { await initialize(); const { user } = authenticate(request); return user ? HttpResponse.json(publicUser(user)) : fail('Entre novamente', 401, 'SESSION_EXPIRED') }),
  http.patch('/api/profile', async ({ request }) => {
    await initialize(); const { user, db } = authenticate(request)
    if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const parsed = profileSchema.safeParse(await request.json())
    if (!parsed.success) return fail('Revise os campos', 422, 'VALIDATION', Object.fromEntries(parsed.error.issues.map(i => [i.path[0], i.message])))
    if (db.users.some(other => other.id !== user.id && other.email === parsed.data.email)) return fail('E-mail já cadastrado', 409, 'CONFLICT', { email: 'E-mail já cadastrado' })
    Object.assign(user, parsed.data); write(db); return HttpResponse.json(publicUser(user))
  }),
  http.post('/api/password', async ({ request }) => {
    await initialize(); const initial = authenticate(request)
    if (!initial.user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const parsed = passwordSchema.safeParse(await request.json())
    if (!parsed.success) return fail('Revise os campos', 422, 'VALIDATION')
    if (await digest(parsed.data.currentPassword, initial.user.salt) !== initial.user.hash) return fail('Senha atual incorreta', 422, 'VALIDATION', { currentPassword: 'Senha atual incorreta' })
    const salt = crypto.randomUUID(), hash = await digest(parsed.data.newPassword, salt), current = authenticate(request)
    if (!current.user || current.user.id !== initial.user.id) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    if (current.user.hash !== initial.user.hash) return fail('Senha alterada em outra operação. Tente novamente.', 409, 'CONFLICT')
    current.user.salt = salt; current.user.hash = hash; write(current.db); return HttpResponse.json({ ok: true })
  }),
  http.get('/api/wallets', async ({ request }) => { await initialize(); const { user } = authenticate(request); return user ? HttpResponse.json(user.wallets || []) : fail('Entre novamente', 401, 'SESSION_EXPIRED') }),
  http.post('/api/wallets', async ({ request }) => {
    await initialize(); const { user, db } = authenticate(request); if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const input = walletSchema.safeParse(await request.json()); if (!input.success) return fail('Revise os dados da carteira', 422, 'VALIDATION', Object.fromEntries(input.error.issues.map(i => [i.path[0], i.message])))
    const wallets = user.wallets ||= []
    if (wallets.some(w => addressIdentity(w.address, w.network) === addressIdentity(input.data.address, input.data.network) && w.network === input.data.network)) return fail('Carteira já cadastrada nesta rede', 409, 'CONFLICT')
    if (wallets.length >= 2) return fail('Limite de duas carteiras atingido', 409, 'CONFLICT')
    const wallet = { ...input.data, id: crypto.randomUUID(), primary: wallets.length === 0 || input.data.primary }
    if (wallet.primary) wallets.forEach(w => { w.primary = false }); wallets.push(wallet); write(db); return HttpResponse.json(wallet, { status: 201 })
  }),
  http.patch('/api/wallets/:id', async ({ request, params }) => {
    await initialize(); const { user, db } = authenticate(request); if (!user) return fail('Entre novamente', 401, 'SESSION_EXPIRED')
    const input = walletSchema.safeParse(await request.json()); if (!input.success) return fail('Revise os dados da carteira', 422, 'VALIDATION', Object.fromEntries(input.error.issues.map(i => [i.path[0], i.message])))
    const wallets = user.wallets || [], wallet = wallets.find(w => w.id === params.id)
    if (!wallet) return fail('Carteira não encontrada', 404, 'NOT_FOUND')
    if (wallets.some(w => w.id !== wallet.id && addressIdentity(w.address, w.network) === addressIdentity(input.data.address, input.data.network) && w.network === input.data.network)) return fail('Carteira já cadastrada nesta rede', 409, 'CONFLICT')
    if (wallet.primary && !input.data.primary && !wallets.some(w => w.id !== wallet.id && w.primary)) return fail('Selecione uma carteira principal', 422, 'VALIDATION')
    if (input.data.primary) wallets.forEach(w => { w.primary = false }); Object.assign(wallet, input.data); write(db); return HttpResponse.json(wallet)
  }),
  http.post('/api/demo/expire-session', async ({ request }) => { await initialize(); const { db, session } = authenticate(request); if (session) { session.expiresAt = 0; write(db) } return HttpResponse.json({ ok: true }) }),
]

export async function requestUser(request: Request) { await initialize(); return authenticate(request).user }

import { http, HttpResponse } from 'msw'
import { loginRequest, signupRequest, socialLoginRequest } from '@/domain/auth/schema'
import {
  createSession,
  dropSession,
  hashPassword,
  newSalt,
  passwordMatches,
  publicUser,
  requireSession,
} from '@/mocks/auth'
import { getDb, saveDb } from '@/mocks/db'
import { apiError, validationError } from '@/mocks/responses'
import { simulate } from '@/mocks/scenarios'

export const authHandlers = [
  http.post('/api/auth/signup', async ({ request }) => {
    const failure = await simulate('auth')
    if (failure) return failure

    const parsed = signupRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const db = getDb()
    const { username, email, password } = parsed.data
    const fields: Record<string, string> = {}
    if (db.users.some((u) => u.email === email)) fields.email = 'Este e-mail já está em uso'
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      fields.username = 'Este nome de usuário já está em uso'
    }
    if (Object.keys(fields).length) {
      return apiError(409, 'CONFLICT', 'Já existe uma conta com esses dados.', { fields })
    }

    const salt = newSalt()
    const created = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      username,
      email,
      displayName: username,
      ensName: '',
      walletNickname: '',
      avatar: null,
      salt,
      passwordHash: await hashPassword(salt, password),
      createdAt: new Date().toISOString(),
    }
    db.users.push(created)
    const session = createSession(created.id)
    saveDb()

    return HttpResponse.json(
      { token: session.token, expiresAt: session.expiresAt, user: publicUser(created) },
      { status: 201 },
    )
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const failure = await simulate('auth')
    if (failure) return failure

    const parsed = loginRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const user = getDb().users.find((u) => u.email === parsed.data.email)
    if (!user || !(await passwordMatches(user, parsed.data.password))) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }

    const session = createSession(user.id)
    return HttpResponse.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(user),
    })
  }),

  http.post('/api/auth/social', async ({ request }) => {
    const failure = await simulate('auth')
    if (failure) return failure

    const parsed = socialLoginRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const db = getDb()
    const provider = parsed.data.provider
    let user = db.users[0]
    if (!user) {
      const salt = newSalt()
      user = {
        id: `usr_${provider}`,
        username: `colecionador.${provider}`,
        email: `${provider}@kurio.io`,
        displayName: provider === 'google' ? 'Colecionador Google' : 'Colecionador Facebook',
        ensName: 'kurio.eth',
        walletNickname: 'Carteira Principal',
        avatar: null,
        salt,
        passwordHash: await hashPassword(salt, 'Kurio2026!'),
        createdAt: new Date().toISOString(),
      }
      db.users.push(user)
    }

    const session = createSession(user.id)
    saveDb()
    return HttpResponse.json({
      token: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(user),
    })
  }),

  http.get('/api/auth/session', async ({ request }) => {
    const failure = await simulate('auth')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json({ user: publicUser(auth.user), expiresAt: auth.session.expiresAt })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    const failure = await simulate('auth')
    if (failure) return failure

    const auth = requireSession(request)
    if (!(auth instanceof Response)) dropSession(auth.token)
    return new HttpResponse(null, { status: 204 })
  }),
]

import { http, HttpResponse } from 'msw'
import {
  avatarLimits,
  changePasswordRequest,
  profile,
  updateProfileRequest,
} from '@/domain/profile/schema'
import { hashPassword, newSalt, passwordMatches, requireSession } from '@/mocks/auth'
import { getDb, saveDb } from '@/mocks/db'
import { apiError, validationError } from '@/mocks/responses'
import { simulate } from '@/mocks/scenarios'

const invalidAvatar = (message: string) =>
  apiError(422, 'VALIDATION', 'Revise os campos destacados.', { fields: { avatar: message } })

async function toDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `data:${file.type};base64,${btoa(binary)}`
}

export const profileHandlers = [
  http.get('/api/profile', async ({ request }) => {
    const failure = await simulate('profile')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json(profile.parse(auth.user))
  }),

  http.patch('/api/profile', async ({ request }) => {
    const failure = await simulate('profile')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = updateProfileRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { username, email } = parsed.data
    const others = getDb().users.filter((u) => u.id !== auth.user.id)
    const fields: Record<string, string> = {}
    if (email && others.some((u) => u.email === email)) fields.email = 'Este e-mail já está em uso'
    if (username && others.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
      fields.username = 'Este nome de usuário já está em uso'
    }
    if (Object.keys(fields).length) {
      return apiError(409, 'CONFLICT', 'Já existe uma conta com esses dados.', { fields })
    }

    Object.assign(auth.user, parsed.data)
    saveDb()
    return HttpResponse.json(profile.parse(auth.user))
  }),

  http.put('/api/profile/avatar', async ({ request }) => {
    const failure = await simulate('profile')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) return invalidAvatar('Selecione uma imagem')
    if (!avatarLimits.types.includes(file.type)) return invalidAvatar('Formato não aceito. Use JPEG, PNG ou WebP')
    if (file.size > avatarLimits.maxBytes) return invalidAvatar('Arquivo muito grande. O máximo é 500 KB')

    auth.user.avatar = await toDataUrl(file)
    saveDb()
    return HttpResponse.json(profile.parse(auth.user))
  }),

  http.delete('/api/profile/avatar', async ({ request }) => {
    const failure = await simulate('profile')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    auth.user.avatar = null
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.put('/api/profile/password', async ({ request }) => {
    const failure = await simulate('profile')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = changePasswordRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const { currentPassword, newPassword } = parsed.data
    if (!(await passwordMatches(auth.user, currentPassword))) {
      return apiError(422, 'VALIDATION', 'Revise os campos destacados.', {
        fields: { currentPassword: 'Senha atual incorreta' },
      })
    }

    auth.user.salt = newSalt()
    auth.user.passwordHash = await hashPassword(auth.user.salt, newPassword)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]

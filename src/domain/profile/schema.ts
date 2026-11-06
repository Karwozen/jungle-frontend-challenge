import { z } from 'zod'
import { email, password, username } from '@/domain/auth/schema'

export const avatarLimits = {
  maxBytes: 500 * 1024,
  types: ['image/jpeg', 'image/png', 'image/webp'],
}

const displayName = z
  .string()
  .trim()
  .min(2, 'Use pelo menos 2 caracteres')
  .max(40, 'Use no máximo 40 caracteres')

export const ensName = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen')

const walletNickname = z
  .string()
  .trim()
  .min(2, 'Use pelo menos 2 caracteres')
  .max(30, 'Use no máximo 30 caracteres')

export const profileFields = z.object({ displayName, username, email, ensName, walletNickname })

export const updateProfileRequest = profileFields.partial()

export const profile = z.object({
  id: z.string(),
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatar: z.string().nullable(),
})

export const changePasswordRequest = z.object({
  currentPassword: z.string().min(1, 'Digite a senha atual'),
  newPassword: password,
})

export const changePasswordForm = changePasswordRequest
  .extend({ confirmPassword: z.string().min(1, 'Confirme a nova senha') })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

export type Profile = z.infer<typeof profile>
export type UpdateProfileRequest = z.infer<typeof updateProfileRequest>
export type ChangePasswordRequest = z.infer<typeof changePasswordRequest>
export type ChangePasswordForm = z.infer<typeof changePasswordForm>

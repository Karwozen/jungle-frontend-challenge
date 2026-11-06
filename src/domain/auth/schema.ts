import { z } from 'zod'
import { isoDate } from '@/domain/common/schema'

export const username = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(24, 'Use no máximo 24 caracteres')
  .regex(/^[a-zA-Z0-9_.]+$/, 'Use apenas letras, números, ponto e sublinhado')

export const email = z.string().trim().toLowerCase().pipe(z.email('Digite um e-mail válido'))

export const password = z
  .string()
  .min(8, 'Use pelo menos 8 caracteres')
  .regex(/[A-Za-z]/, 'Inclua pelo menos uma letra')
  .regex(/\d/, 'Inclua pelo menos um número')

export const signupRequest = z.object({ username, email, password })

export const signupForm = signupRequest
  .extend({ confirmPassword: z.string().min(1, 'Confirme a senha') })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem',
  })

export const loginRequest = z.object({
  email,
  password: z.string().min(1, 'Digite sua senha'),
})

export const socialProvider = z.enum(['google', 'facebook'])

export const socialLoginRequest = z.object({
  provider: socialProvider,
})

export const user = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
})

export const session = z.object({
  user,
  expiresAt: isoDate,
})

export const authResponse = session.extend({ token: z.string() })

export type User = z.infer<typeof user>
export type Session = z.infer<typeof session>
export type AuthResponse = z.infer<typeof authResponse>
export type SignupRequest = z.infer<typeof signupRequest>
export type SignupForm = z.infer<typeof signupForm>
export type LoginRequest = z.infer<typeof loginRequest>
export type SocialProvider = z.infer<typeof socialProvider>
export type SocialLoginRequest = z.infer<typeof socialLoginRequest>

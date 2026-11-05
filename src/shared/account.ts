import { networks, isNetworkAddress, type Network } from './networks'
import { z } from 'zod'
export const loginSchema = z.object({ email: z.email('Informe um e-mail válido').transform(v => v.toLowerCase()), password: z.string().min(1, 'Informe sua senha') })
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2, 'Informe seu nome').max(100), password: z.string().min(8, 'Use pelo menos 8 caracteres').max(128) })
export interface User { id: string; name: string; email: string; avatar?: string }
export interface Wallet { id: string; label: string; address: string; network: Network; primary: boolean }
export const profileSchema = z.object({ name: z.string().trim().min(2, 'Informe seu nome').max(100), email: z.email('Informe um e-mail válido').transform(value => value.toLowerCase()), avatar: z.string().max(1400000).refine(value => !value || /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value), 'Use uma imagem PNG, JPEG ou WebP válida') })
export const passwordSchema = z.object({ currentPassword: z.string().min(1, 'Informe a senha atual'), newPassword: z.string().min(8, 'Use pelo menos 8 caracteres').max(128) })
export const walletSchema = z.object({ label: z.string().trim().min(2, 'Informe o nome da carteira').max(50), address: z.string().trim().max(44), network: z.enum(networks), primary: z.boolean() }).superRefine((wallet, ctx) => { if (!isNetworkAddress(wallet.address, wallet.network)) ctx.addIssue({ code: 'custom', path: ['address'], message: wallet.network === 'Solana' ? 'Informe um endereço Solana válido' : 'Informe um endereço EVM válido' }) })
export interface Session { user: User | null; expiresAt?: number }
export interface AuthResponse { user: User; token: string; expiresAt: number }
export function safeReturnTo(value: unknown) { return typeof value === 'string' && /^\/(?!\/)/.test(value) && !value.includes('\\') && [...value].every(character => character.charCodeAt(0) >= 32) ? value : '/account/profile' }

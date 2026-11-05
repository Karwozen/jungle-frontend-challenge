import { isNetworkAddress, type Network } from './networks'
import type { Cart } from './cart'
import type { Wallet } from './account'
import { z } from 'zod'
export const collectorSchema = z.object({
  username: z.string().trim().min(2, 'Informe o nome de usuário').max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Use letras, números, ponto, hífen ou sublinhado'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(100),
  invitationCode: z.string().trim().min(1, 'Informe o código de indicação').max(50),
  lnsName: z.string().trim().min(1, 'Informe o nome LNS').max(100),
  walletType: z.enum(['WalletConnect', 'MetaMask', 'Coinbase Wallet']),
  secondaryAddress: z.union([z.literal(''), z.string().max(44)]),
  note: z.string().trim().max(1000, 'Use até 1000 caracteres'),
})
export const collectorSchemaForNetwork = (network: Network) => collectorSchema.superRefine((data, ctx) => { if (data.secondaryAddress && !isNetworkAddress(data.secondaryAddress, network)) ctx.addIssue({ code: 'custom', path: ['secondaryAddress'], message: `Informe um endereço válido para ${network}` }) })
export type CollectorDetails = z.infer<typeof collectorSchema>
export interface Quote { id: string; cart: Cart; expiresAt: number }
export interface OrderInput extends CollectorDetails { quoteId: string; walletId: string; network: Wallet['network']; name: string; email: string; accepted: boolean }
export interface Order { id: string; userId: string; status: 'pending' | 'confirmed' | 'declined'; version: number; cart: Cart; wallet: Wallet; collector: { name: string; email: string } & Partial<CollectorDetails>; createdAt: number; transaction?: string; reason?: string }

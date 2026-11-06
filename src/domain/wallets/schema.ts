import { z } from 'zod'
import { email } from '@/domain/auth/schema'
import { networks, type Network } from '@/domain/catalog/schema'
import { isoDate } from '@/domain/common/schema'
import { ensName } from '@/domain/profile/schema'

export const walletProviders = ['metamask', 'walletconnect', 'coinbase-wallet'] as const
export const walletRoles = ['primary', 'secondary'] as const
export const ensSuffixes = ['eth', 'btc', 'sol', 'crypto', 'bnb'] as const

const evmAddress = /^0x[a-fA-F0-9]{40}$/
const addressPattern: Record<Network, RegExp> = {
  ethereum: evmAddress,
  polygon: evmAddress,
  solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
}

const name = (max: number) =>
  z.string().trim().min(2, 'Use pelo menos 2 caracteres').max(max, `Use no máximo ${max} caracteres`)

export const walletFields = z.object({
  displayName: name(40),
  alias: name(30),
  network: z.enum(networks),
  profileName: name(30),
  address: z.string().trim().min(1, 'Informe o endereço da carteira'),
  secondaryAddress: z.string().trim(),
  provider: z.enum(walletProviders),
  referralCode: z.string().trim().regex(/^[A-Za-z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números'),
  email,
  ensName,
  ensSuffix: z.enum(ensSuffixes),
})

const addressMatchesNetwork = (w: { network: Network; address: string }) =>
  addressPattern[w.network].test(w.address)
const addressIssue = { path: ['address'], message: 'Endereço inválido para esta rede' }

export const walletInput = walletFields.refine(addressMatchesNetwork, addressIssue)

export const createWalletRequest = walletFields
  .extend({ role: z.enum(walletRoles) })
  .refine(addressMatchesNetwork, addressIssue)

export const connectRequest = z.object({ network: z.enum(networks) })

export const connection = z.object({ network: z.enum(networks), connectedAt: isoDate })

export const wallet = walletFields.extend({
  id: z.string(),
  role: z.enum(walletRoles),
  connection: connection.nullable(),
})

export type WalletProvider = (typeof walletProviders)[number]
export type Wallet = z.infer<typeof wallet>
export type WalletInput = z.infer<typeof walletInput>
export type CreateWalletRequest = z.infer<typeof createWalletRequest>
export type Connection = z.infer<typeof connection>

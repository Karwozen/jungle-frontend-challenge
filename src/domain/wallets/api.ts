import { http } from '@/lib/http'
import type { Network } from '@/domain/catalog/schema'
import {
  connection,
  wallet,
  type Connection,
  type CreateWalletRequest,
  type Wallet,
  type WalletInput,
} from './schema'

export async function listWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const { data } = await http.get('/wallets', { signal })
  return wallet.array().parse(data)
}

export async function createWallet(body: CreateWalletRequest): Promise<Wallet> {
  const { data } = await http.post('/wallets', body)
  return wallet.parse(data)
}

export async function updateWallet(id: string, body: WalletInput): Promise<Wallet> {
  const { data } = await http.put(`/wallets/${encodeURIComponent(id)}`, body)
  return wallet.parse(data)
}

export async function connectWallet(id: string, network: Network): Promise<Connection> {
  const { data } = await http.post(`/wallets/${encodeURIComponent(id)}/connect`, { network })
  return connection.parse(data)
}

export async function disconnectWallet(id: string): Promise<void> {
  await http.post(`/wallets/${encodeURIComponent(id)}/disconnect`)
}

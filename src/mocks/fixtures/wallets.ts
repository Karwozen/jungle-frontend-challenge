import type { Wallet } from '@/domain/wallets/schema'

export type WalletRecord = Wallet & { userId: string }

// a Juliana tem a principal e a reserva; o Theo não tem nenhuma
export function createWallets(): WalletRecord[] {
  return [
    {
      id: 'wal_juliana_main',
      userId: 'usr_juliana',
      role: 'primary',
      displayName: 'Juliana Costa',
      alias: 'Carteira do dia a dia',
      network: 'ethereum',
      profileName: 'juliana',
      address: '0x4b1f7a9c2d8e03a5b6c7d1e9f2a30b48c5d6e7f1',
      secondaryAddress: '',
      provider: 'metamask',
      referralCode: 'KURIO26',
      email: 'juliana@kurio.dev',
      ensName: 'juliana',
      ensSuffix: 'eth',
      connection: null,
    },
    {
      id: 'wal_juliana_reserve',
      userId: 'usr_juliana',
      role: 'secondary',
      displayName: 'Juliana Costa',
      alias: 'Reserva',
      network: 'polygon',
      profileName: 'juliana',
      address: '0x9d3e5f7a1b2c4d6e8f0a1b3c5d7e9f2a4b6c8d0e',
      secondaryAddress: '',
      provider: 'walletconnect',
      referralCode: 'KURIO26',
      email: 'juliana@kurio.dev',
      ensName: 'nova-kurio',
      ensSuffix: 'eth',
      connection: null,
    },
  ]
}

export const initialFavorites: Record<string, string[]> = {
  usr_juliana: ['emerald-ape-042', 'golden-signal-160'],
  usr_theo: [],
}

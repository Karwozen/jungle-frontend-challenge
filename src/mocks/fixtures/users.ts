// senha de demonstração dos dois usuários: Kurio@2026 (juliana@kurio.dev e theo@kurio.dev)
export interface StoredUser {
  id: string
  username: string
  email: string
  displayName: string
  ensName: string
  walletNickname: string
  avatar: string | null
  salt: string
  passwordHash: string
  createdAt: string
}

export function createUsers(): StoredUser[] {
  return [
    {
      id: 'usr_juliana',
      username: 'juliana',
      email: 'juliana@kurio.dev',
      displayName: 'Juliana Costa',
      ensName: 'juliana',
      walletNickname: 'Carteira do dia a dia',
      avatar: null,
      salt: 'a1f3c2d4e5b60718293a4b5c6d7e8f90',
      passwordHash: 'e5c3f076e1d3a3ccb6ff5d299671ff36acbed376cec98d98ead44b66658d86f5',
      createdAt: '2026-06-12T10:00:00.000Z',
    },
    {
      id: 'usr_theo',
      username: 'theo',
      email: 'theo@kurio.dev',
      displayName: 'Theo Marlowe',
      ensName: 'theo',
      walletNickname: 'Cofre frio',
      avatar: null,
      salt: '0f9e8d7c6b5a49382716f5e4d3c2b1a0',
      passwordHash: '084c1ed7a0c1149a51d48b334deff67be8e5475662b59076f90b0816d43a2b1c',
      createdAt: '2026-07-03T15:30:00.000Z',
    },
  ]
}

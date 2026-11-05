export const networks = ['Ethereum', 'Polygon', 'Solana'] as const
export type Network = typeof networks[number]
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
export function isSolanaAddress(address: string) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return false
  let value = 0n
  for (const character of address) value = value * 58n + BigInt(alphabet.indexOf(character))
  let bytes = 0
  while (value) { bytes++; value >>= 8n }
  return bytes + (address.match(/^1*/)?.[0].length || 0) === 32
}
export const isNetworkAddress = (address: string, network: Network) => network === 'Solana' ? isSolanaAddress(address) : /^0x[a-fA-F0-9]{40}$/.test(address)
export const addressIdentity = (address: string, network: Network) => network === 'Solana' ? address : address.toLowerCase()

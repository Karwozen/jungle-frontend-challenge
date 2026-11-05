const SCALE = 10n ** 18n
export function parseEth(value: string): bigint {
  if (!/^\d+(?:\.\d{1,18})?$/.test(value)) throw new Error('Valor ETH inválido')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(18, '0'))
}
export function serializeEth(value: bigint): string {
  if (value < 0n) throw new Error('Valor ETH negativo')
  const fraction = (value % SCALE).toString().padStart(18, '0').replace(/0+$/, '')
  return `${value / SCALE}${fraction ? `.${fraction}` : ''}`
}

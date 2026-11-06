import Big from 'big.js'

// 18 casas (wei), cortando em vez de arredondar
Big.DP = 18
Big.RM = Big.roundDown

export type EthAmount = string

export function normalizeEth(value: string | Big): EthAmount {
  const fixed = new Big(value).toFixed(18)
  return fixed.replace(/\.?0+$/, '') || '0'
}

export function addEth(a: EthAmount, b: EthAmount): EthAmount {
  return normalizeEth(new Big(a).plus(b))
}

export function subEth(a: EthAmount, b: EthAmount): EthAmount {
  return normalizeEth(new Big(a).minus(b))
}

export function mulEth(a: EthAmount, qty: number): EthAmount {
  return normalizeEth(new Big(a).times(qty))
}

export function percentOfEth(a: EthAmount, percent: number): EthAmount {
  return normalizeEth(new Big(a).times(percent).div(100))
}

export function compareEth(a: EthAmount, b: EthAmount): -1 | 0 | 1 {
  return new Big(a).cmp(b) as -1 | 0 | 1
}

interface FormatOptions {
  minDecimals?: number
  maxDecimals?: number
  unit?: boolean
}

export function formatEth(
  value: EthAmount,
  { minDecimals = 2, maxDecimals = 4, unit = true }: FormatOptions = {},
): string {
  const [int, dec = ''] = new Big(value).toFixed(maxDecimals).split('.')
  let decimals = dec
  while (decimals.length > minDecimals && decimals.endsWith('0')) {
    decimals = decimals.slice(0, -1)
  }
  const text = decimals ? `${int}.${decimals}` : int
  return unit ? `${text} ETH` : text
}

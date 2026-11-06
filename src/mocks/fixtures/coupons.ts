export interface Coupon {
  code: string
  percent: number
  expiresAt: string
}

export const coupons: Coupon[] = [
  { code: 'WELCOME10', percent: 10, expiresAt: '2030-12-31T23:59:59.000Z' },
  { code: 'COLLECTOR5', percent: 5, expiresAt: '2030-12-31T23:59:59.000Z' },
  { code: 'SUMMER25', percent: 25, expiresAt: '2025-03-01T00:00:00.000Z' },
]

export const NETWORK_FEE = '0.016'

import { describe, expect, it } from 'vitest'
import { parseEth, serializeEth } from '../src/shared/money'
describe('ETH com precisão de 18 casas', () => {
  it('soma sem arredondamento de ponto flutuante', () => expect(serializeEth(parseEth('0.1') + parseEth('0.2'))).toBe('0.3'))
  it('preserva uma unidade mínima', () => expect(serializeEth(parseEth('123456789.000000000000000001'))).toBe('123456789.000000000000000001'))
  it('recusa precisão além do contrato', () => expect(() => parseEth('0.0000000000000000001')).toThrow())
})

import { http } from '@/lib/http'
import { cart, type Cart, type CartLine } from './schema'

export async function getCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await http.get('/cart', { signal })
  return cart.parse(data)
}

export async function addCartItem(body: CartLine): Promise<Cart> {
  const { data } = await http.post('/cart/items', body)
  return cart.parse(data)
}

export async function updateCartItem(id: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch(`/cart/items/${encodeURIComponent(id)}`, { quantity })
  return cart.parse(data)
}

export async function removeCartItem(id: string): Promise<Cart> {
  const { data } = await http.delete(`/cart/items/${encodeURIComponent(id)}`)
  return cart.parse(data)
}

export async function mergeCart(items: CartLine[]): Promise<Cart> {
  const { data } = await http.post('/cart/merge', { items })
  return cart.parse(data)
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await http.put('/cart/coupon', { code })
  return cart.parse(data)
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await http.delete('/cart/coupon')
  return cart.parse(data)
}

// aceita os preços atuais, limpando o aviso de preço alterado
export async function acknowledgePrices(): Promise<Cart> {
  const { data } = await http.post('/cart/acknowledge')
  return cart.parse(data)
}

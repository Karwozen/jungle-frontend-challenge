import { http } from '@/lib/http'
import { order, type CreateOrderRequest, type Order, type OrderStatus } from './schema'

export async function createOrder(body: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
  const { data } = await http.post('/orders', body, { headers: { 'Idempotency-Key': idempotencyKey } })
  return order.parse(data)
}

export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await http.get(`/orders/${encodeURIComponent(id)}`, { signal })
  return order.parse(data)
}

export async function listOrders(status?: OrderStatus, signal?: AbortSignal): Promise<Order[]> {
  const { data } = await http.get('/orders', { params: { status }, signal })
  return order.array().parse(data)
}

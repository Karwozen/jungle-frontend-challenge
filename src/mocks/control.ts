import type { Endpoint, ScenarioName } from '@/mocks/scenarios'

// fala com as rotas de apoio do mock: o servidor muda, e o app recebe pelo REST e pelo socket como em produção
async function call<T = null>(path: string, method = 'POST', body?: unknown): Promise<T> {
  const response = await fetch(`/api/__mock${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Falha ${response.status} em ${path}`)
  return (response.status === 204 ? null : await response.json()) as T
}

export interface MockEvent {
  id: string
  type: string
  resource: { type: string; id: string }
  version: number
}

export const mockControl = {
  reset: () => call('/reset'),
  setScenario: (name: ScenarioName, on: Endpoint[]) => call('/scenario', 'POST', { name, on }),
  patchNft: (id: string, body: { price?: string; stock?: Record<string, number | null> }) =>
    call<{ id: string; version: number }>(`/nfts/${id}`, 'PATCH', body),
  settleOrder: (id: string, outcome: 'confirmed' | 'refused') => call(`/orders/${id}/settle`, 'POST', { outcome }),
  events: () => call<MockEvent[]>('/events', 'GET'),
  replay: (eventId: string) => call('/events/replay', 'POST', { eventId }),
  disconnect: () => call<{ closed: number }>('/socket/disconnect'),
}

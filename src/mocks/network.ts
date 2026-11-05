import { http, HttpResponse, delay } from 'msw'
import { z } from 'zod'

const KEY = 'kurio.mock.network.v1'
const schema = z.object({
  mode: z.enum(['normal', 'offline', 'server-error', 'slow', 'timeout']),
  scope: z.string().regex(/^\/api(?:\/[a-zA-Z0-9_~-]+)*$/).default('/api'),
  method: z.enum(['*', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE']).default('*'),
  delays: z.array(z.number().int().min(0).max(10000)).min(1).max(20).default([1200, 100]),
  remaining: z.number().int().min(0).max(100).nullable().default(null),
})
type Scenario = z.infer<typeof schema> & { cursor: number }
const initial = (): Scenario => ({ ...schema.parse({ mode: 'normal' }), cursor: 0 })
const read = (): Scenario => { try { const value = JSON.parse(localStorage.getItem(KEY) || 'null'); return value ? { ...schema.parse(value), cursor: Number.isSafeInteger(value.cursor) ? value.cursor : 0 } : initial() } catch { return initial() } }
export const resetNetwork = () => localStorage.removeItem(KEY)
export const networkHandlers = [
  http.get('/api/demo/network-scenario', () => HttpResponse.json(read())),
  http.post('/api/demo/network-scenario', async ({ request }) => {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) return HttpResponse.json({ code: 'VALIDATION', message: 'Cenário de rede inválido' }, { status: 422 })
    const scenario = { ...parsed.data, cursor: 0 }
    localStorage.setItem(KEY, JSON.stringify(scenario))
    return HttpResponse.json(scenario)
  }),
  http.all('/api/*', async ({ request }) => {
    const path = new URL(request.url).pathname
    // Recovery controls must remain reachable while the simulated API is offline.
    if (path.startsWith('/api/demo/')) return
    const scenario = read()
    if (scenario.mode === 'normal' || (path !== scenario.scope && !path.startsWith(scenario.scope + '/')) || (scenario.method !== '*' && scenario.method !== request.method)) return
    if (scenario.remaining !== null && scenario.remaining <= 0) return
    if (scenario.remaining !== null) scenario.remaining--
    const latency = scenario.delays[scenario.cursor % scenario.delays.length]
    scenario.cursor++
    localStorage.setItem(KEY, JSON.stringify(scenario))
    if (scenario.mode === 'timeout') { await delay(13000); return HttpResponse.error() }
    if (scenario.mode === 'offline') return HttpResponse.error()
    if (scenario.mode === 'server-error') return HttpResponse.json({ code: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível. Tente novamente.' }, { status: 503 })
    await delay(latency)
    // An undefined response lets the matching business handler resolve normally.
  }),
]

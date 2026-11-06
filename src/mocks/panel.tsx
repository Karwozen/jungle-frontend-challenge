import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { formatEth, mulEth } from '@/lib/eth'
import { http } from '@/lib/http'
import { clearToken } from '@/lib/session-token'
import { cn } from '@/lib/utils'
import { mockControl } from './control'
import { endpoints, getScenario, scenarios, type Endpoint, type ScenarioName } from './scenarios'

const scenarioLabels: Record<ScenarioName, string> = {
  default: 'Tudo funciona',
  empty: 'Listas vazias',
  slow: 'Respostas lentas',
  jitter: 'Latência variável (respostas fora de ordem)',
  'server-error': 'Erro 500 do servidor',
  offline: 'Sem conexão',
  timeout: 'Estouro de tempo',
  'session-expired': 'Sessão expirada',
  'wallet-rejected': 'Carteira recusa a conexão',
  'price-changed': 'Preço muda durante a compra',
  'sold-out': 'Edição esgota durante a compra',
  'order-timeout': 'Pedido criado, resposta atrasada',
  'payment-refused': 'Pagamento recusado',
  'manual-settlement': 'Pedido só liquida manualmente',
  'socket-offline': 'Socket indisponível',
}

type Tab = 'scenarios' | 'realtime' | 'data'

const tabs: { id: Tab; label: string }[] = [
  { id: 'scenarios', label: 'Cenários' },
  { id: 'realtime', label: 'Tempo real' },
  { id: 'data', label: 'Dados' },
]

const button = 'rounded-md border border-border-soft px-3 py-1.5 text-xs outline-none hover:bg-secondary/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'

interface NftOption {
  id: string
  name: string
  price: string
}

interface PendingOrder {
  id: string
  total: string
}

function MockPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('scenarios')
  const [message, setMessage] = useState('')

  const [scenario, setScenario] = useState<ScenarioName>(getScenario())
  const [on, setOn] = useState<Endpoint[]>([])

  const [nfts, setNfts] = useState<NftOption[]>([])
  const [nftId, setNftId] = useState('')
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [orderId, setOrderId] = useState('')

  useEffect(() => {
    if (!open || tab !== 'realtime') return
    fetch('/api/nfts')
      .then((r) => r.json())
      .then((page: { items: NftOption[] }) => {
        setNfts(page.items)
        setNftId((current) => current || page.items[0]?.id || '')
      })
      .catch(() => setNfts([]))
    http
      .get<PendingOrder[]>('/orders', { params: { status: 'pending' } })
      .then(({ data }) => {
        setOrders(data)
        setOrderId((current) => current || data[0]?.id || '')
      })
      .catch(() => setOrders([]))
  }, [open, tab])

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      await action()
      setMessage(`${label}: feito.`)
    } catch (error) {
      setMessage(`${label}: ${(error as Error).message}`)
    }
  }

  const nft = nfts.find((item) => item.id === nftId)
  const reprice = (factor: number) =>
    run('Preço alterado', () => mockControl.patchNft(nftId, { price: mulEth(nft!.price, factor) }))

  const replayFor = (pick: 'last' | 'first') =>
    run(pick === 'last' ? 'Evento duplicado' : 'Evento antigo', async () => {
      const events = (await mockControl.events()).filter((e) => e.resource.id === nftId)
      const event = pick === 'last' ? events.at(-1) : events.at(0)
      if (!event) throw new Error('nenhum evento desse NFT ainda')
      await mockControl.replay(event.id)
    })

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex flex-col items-end gap-3 max-md:top-[45%] max-md:right-2 max-md:bottom-auto max-md:flex-col-reverse">
      {open && (
        <section aria-label="Painel de mocks" className="max-h-[70dvh] w-88 max-w-[calc(100vw-1rem)] overflow-y-auto max-md:max-h-[40dvh] rounded-xl border border-border-soft bg-card p-4 text-xs shadow-2xl">
          <div role="tablist" aria-label="Seções do painel" className="mb-4 flex gap-1 border-b border-border-soft">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={cn('-mb-px border-b-2 border-transparent px-3 pb-2 outline-none focus-visible:text-text-accent', tab === id && 'border-primary font-bold text-text-accent')}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'scenarios' && (
            <div className="space-y-4">
              <fieldset className="space-y-1.5">
                <legend className="mb-1 font-bold">Cenário</legend>
                {scenarios.map((name) => (
                  <label key={name} className="flex cursor-pointer items-center gap-2">
                    <input type="radio" name="scenario" checked={scenario === name} onChange={() => setScenario(name)} className="accent-primary" />
                    {scenarioLabels[name]}
                  </label>
                ))}
              </fieldset>
              <fieldset className="space-y-1.5">
                <legend className="mb-1 font-bold">Aplicar em (vazio = tudo)</legend>
                <div className="grid grid-cols-2 gap-1">
                  {endpoints.map((endpoint) => (
                    <label key={endpoint} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={on.includes(endpoint)}
                        onChange={(event) => setOn(event.target.checked ? [...on, endpoint] : on.filter((e) => e !== endpoint))}
                        className="accent-primary"
                      />
                      {endpoint}
                    </label>
                  ))}
                </div>
              </fieldset>
              <button type="button" className={cn(button, 'bg-primary text-primary-foreground')} onClick={() => run('Cenário aplicado', () => mockControl.setScenario(scenario, on))}>
                Aplicar cenário
              </button>
            </div>
          )}

          {tab === 'realtime' && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="mock-nft" className="font-bold">
                  NFT
                </label>
                <select id="mock-nft" value={nftId} onChange={(event) => setNftId(event.target.value)} className="h-9 w-full rounded-md border border-border bg-transparent px-2 [color-scheme:dark]">
                  {nfts.map((item) => (
                    <option key={item.id} value={item.id} className="bg-card">
                      {item.name} · {formatEth(item.price)}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={button} disabled={!nft} onClick={() => reprice(1.1)}>
                    Preço +10%
                  </button>
                  <button type="button" className={button} disabled={!nft} onClick={() => reprice(0.9)}>
                    Preço −10%
                  </button>
                  <button type="button" className={button} disabled={!nft} onClick={() => run('NFT esgotado', async () => {
                    await mockControl.patchNft(nftId, { stock: Object.fromEntries((await editionIds(nftId)).map((id) => [id, 0])) })
                  })}>
                    Esgotar
                  </button>
                  <button type="button" className={button} disabled={!nft} onClick={() => replayFor('last')}>
                    Evento duplicado
                  </button>
                  <button type="button" className={button} disabled={!nft} onClick={() => replayFor('first')}>
                    Evento antigo
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="mock-order" className="font-bold">
                  Pedido pendente
                </label>
                <select id="mock-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} className="h-9 w-full rounded-md border border-border bg-transparent px-2 [color-scheme:dark]">
                  {orders.length === 0 && <option value="">Nenhum pedido pendente</option>}
                  {orders.map((order) => (
                    <option key={order.id} value={order.id} className="bg-card">
                      {order.id} · {formatEth(order.total)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="button" className={button} disabled={!orderId} onClick={() => run('Pedido confirmado', () => mockControl.settleOrder(orderId, 'confirmed'))}>
                    Confirmar
                  </button>
                  <button type="button" className={button} disabled={!orderId} onClick={() => run('Pedido recusado', () => mockControl.settleOrder(orderId, 'refused'))}>
                    Recusar
                  </button>
                </div>
              </div>

              <button type="button" className={button} onClick={() => run('Conexões derrubadas', mockControl.disconnect)}>
                Derrubar conexão do socket
              </button>
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-3">
              <p className="text-muted-foreground">Volta o catálogo, os usuários e os pedidos ao estado inicial e o cenário para "Tudo funciona".</p>
              <button
                type="button"
                className={cn(button, 'border-destructive text-destructive')}
                onClick={async () => {
                  await mockControl.reset()
                  clearToken()
                  location.assign('/')
                }}
              >
                Resetar dados e cenário
              </button>
            </div>
          )}

          <p role="status" className="mt-4 min-h-4 text-text-secondary">
            {message}
          </p>
        </section>
      )}

      <button
        type="button"
        aria-label="Painel de mocks"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="group flex h-11 items-center rounded-full border border-primary bg-card px-3 text-text-accent shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Flame aria-hidden className="size-5" />
        <span
          aria-hidden
          className="max-w-0 overflow-hidden text-xs font-bold whitespace-nowrap opacity-0 transition-all duration-200 group-hover:ml-2 group-hover:max-w-16 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-16 group-focus-visible:opacity-100"
        >
          Mocks
        </span>
      </button>
    </div>
  )
}

async function editionIds(nftId: string) {
  const { data } = await http.get<{ editions: { id: string }[] }>(`/nfts/${nftId}`)
  return data.editions.map((edition) => edition.id)
}

export default MockPanel

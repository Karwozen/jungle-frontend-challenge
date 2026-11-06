import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import axios from 'axios'
import { api, SESSION_TOKEN_KEY } from '../../shared/api'
import type { Cart } from '../../shared/cart'
import { parseEth, serializeEth } from '../../shared/money'
import { useMobileLayout } from '../../shared/useMobileLayout'
import type { Wallet } from '../../shared/account'
import { collectorSchemaForNetwork, type Order, type OrderInput, type Quote } from '../../shared/orders'
import { CollectorFields, WalletProviders } from './CollectorFields'
import type { ResourceEvent } from '../../shared/contracts'
import { sessionQuery } from '../account/session'
import { Button } from '../../components/ui/button'
import { OrderReceipt } from './OrderReceipt'
import { Artwork } from '../catalog/Artwork'
import { queryClient } from '../../app/query'
import { createSocket } from '../../app/realtime'
const errorMessage = (error: unknown) => axios.isAxiosError(error) ? error.response?.data?.message || 'Falha de conexão. Recupere a mesma tentativa para evitar duplicação.' : 'Não foi possível continuar.'
interface Attempt { key: string; input: OrderInput }
export function CheckoutPage() {
  const session = useQuery(sessionQuery), user = session.data?.user
  if (!user) return <main id="content" className="market-container"><p>Carregando sessão…</p></main>
  return <CheckoutForm key={user.id} user={user}/>
}
function CheckoutForm({ user }: { user: { id: string; name: string; email: string } }) {
  const mobile = useMobileLayout()
  const navigate = useNavigate()
  const storageKey = 'kurio.attempt.' + user.id
  const draftKey = 'kurio.checkout-draft.' + user.id
  const [attempt, setAttempt] = useState<Attempt | null>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || 'null') } catch { return null }
  })
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(draftKey) || '{}') } catch { return {} }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [connected, setConnected] = useState('')
  const [notice, setNotice] = useState('')
  const [review, setReview] = useState<OrderInput | null>(null)
  const wallets = useQuery({
    queryKey: ['private', user.id, 'wallets'],
    queryFn: async ({ signal }) => (await api.get<Wallet[]>('/wallets', { signal })).data,
    enabled: !attempt,
  })
  const cart = useQuery({
    queryKey: ['private', user.id, 'cart'],
    queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data,
    enabled: !attempt,
  })
  const quote = useMutation({
    mutationFn: async () => (await api.post<Quote>('/quotes')).data,
    onSuccess: () => setReview(null),
  })
  const submit = useMutation({
    mutationFn: async (value: Attempt) => (await api.post<Order>('/orders', value.input, { headers: { 'Idempotency-Key': value.key } })).data,
    onSuccess: async order => {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(draftKey)
      setAttempt(null)
      await navigate({ to: '/checkout/orders/$orderId', params: { orderId: order.id } })
    },
    onError: error => {
      if (!axios.isAxiosError(error) || !error.response) return
      const { status, data } = error.response
      if (data.fields) setErrors(data.fields)
      if (status !== 401 && status < 500) {
        localStorage.removeItem(storageKey)
        setAttempt(null)
        setReview(null)
        if (data.code === 'QUOTE_CHANGED') {
          setNotice(data.message)
          quote.mutate()
        }
      }
    },
  })

  useEffect(() => {
    const socket = createSocket()
    const changed = () => {
      setNotice('Preço ou disponibilidade atualizados. Atualize a cotação antes de confirmar.')
      setReview(null)
      void queryClient.invalidateQueries({ predicate: query => query.queryKey[2] === 'cart' })
    }
    let connectedOnce = false
    socket.on('connect', () => { if (connectedOnce) changed(); connectedOnce = true })
    socket.on('nft.updated', changed)
    socket.connect()
    return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [])

  const selectedWallet = wallets.data?.find(wallet => wallet.id === draft.wallet)
    ?? wallets.data?.find(wallet => wallet.primary)
    ?? wallets.data?.[0]
  const network = draft.network || selectedWallet?.network || 'Ethereum'
  const summary = quote.data?.cart ?? cart.data

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    setReview(null)
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>
    if (!wallets.data) delete values.network
    else if (event.target instanceof HTMLInputElement && event.target.name === 'wallet') {
      const walletId = event.target.value
      const chosen = wallets.data.find(item => item.id === walletId)
      if (chosen) values.network = chosen.network
    }
    setDraft(values)
    localStorage.setItem(draftKey, JSON.stringify(values))
  }

  function reviewOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const wallet = wallets.data?.find(item => item.id === data.get('wallet'))
    if (!wallet || wallet.id !== connected || wallet.network !== data.get('network') || !quote.data) {
      setNotice('Conecte a carteira na rede selecionada e obtenha uma cotação.')
      return
    }
    const parsed = collectorSchemaForNetwork(wallet.network).safeParse(Object.fromEntries(data))
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map(issue => [issue.path[0], issue.message])))
      return
    }
    setErrors({})
    setNotice('')
    setReview({
      ...parsed.data,
      name: String(data.get('name')),
      email: String(data.get('email')),
      walletId: wallet.id,
      network: wallet.network,
      quoteId: quote.data.id,
      accepted: true,
    })
  }

  const walletFields = (
    <section className="checkout-wallets" aria-labelledby="checkout-wallet-heading">
      <div className="checkout-section-heading">
        <h2 id="checkout-wallet-heading">Carteira e rede</h2>
        {selectedWallet && <Link to="/account/wallets">Trocar carteira</Link>}
      </div>
      {wallets.isPending ? <div className="skeleton h-20" aria-label="Carregando carteiras"/> : wallets.isError ? (
        <p role="alert">Falha ao carregar carteiras. <Button type="button" onClick={() => void wallets.refetch()}>Tentar novamente</Button></p>
      ) : selectedWallet ? (
        <>
          <fieldset className="checkout-wallet-options">
            <legend>{connected ? 'Carteira conectada' : 'Carteiras cadastradas'}</legend>
            {wallets.data?.map(wallet => (
              <label className="checkout-option" key={wallet.id}>
                <input type="radio" name="wallet" value={wallet.id} checked={wallet.id === selectedWallet.id} onChange={() => setConnected('')}/>
                <span><strong>{wallet.label}</strong><small>{wallet.address}<br/>Rede {wallet.network}</small></span><span className="wallet-option-more" aria-hidden="true">⋮</span>
              </label>
            ))}
          </fieldset>
          <WalletProviders draft={draft}/>
          {mobile && summary && <p className="checkout-mobile-total" data-total={`${summary.total} ETH`} aria-hidden="true">Total:</p>}
          <div className="checkout-connection-actions">
            <Button type="button" variant="outline" onClick={event => {
              const data = new FormData(event.currentTarget.form!)
              if (selectedWallet.network !== data.get('network')) {
                setNotice('A rede selecionada não corresponde à carteira.')
                return
              }
              setConnected(selectedWallet.id)
              setNotice('Carteira conectada na simulação.')
            }}>Conectar carteira</Button>
            <Button type="button" variant="ghost" onClick={() => {
              setConnected(''); setReview(null); setNotice('Conexão recusada na simulação.')
            }}>Simular recusa da conexão</Button>
            {connected && <Button type="button" variant="ghost" onClick={() => {
              setConnected(''); setReview(null); setNotice('Carteira desconectada.')
            }}>Desconectar carteira</Button>}
          </div>
        </>
      ) : <p>Cadastre uma carteira em <Link to="/account/wallets">Minhas carteiras</Link>.</p>}
    </section>
  )

  return (
    <main id="content" className="market-container detail-page checkout-page">
      <nav aria-label="Caminho de navegação" className="breadcrumbs">
        <Link to="/" search={{ q: '', collection: '', sort: 'recent', page: 1 }}>Início</Link>
        <span aria-hidden="true">/</span><Link to="/cart">Carrinho</Link><span aria-hidden="true">/</span><span>Pagamento</span>
      </nav>
      <div className="checkout-heading">
        <Link to="/cart" className="checkout-back" aria-label="Voltar ao carrinho"><ArrowLeft size={18} aria-hidden="true"/></Link>
        <h1 className="checkout-title"><span className="checkout-desktop-title">Pagamento</span><span className="checkout-mobile-title">Pagamento com carteira</span></h1>
      </div>
      {attempt ? (
        <section className="auth-panel">
          <p role="status">Há uma tentativa em andamento. Recupere seu resultado antes de iniciar outra compra.</p>
          <Button disabled={submit.isPending} onClick={() => submit.mutate(attempt)}>Recuperar tentativa</Button>
        </section>
      ) : (
        <form className="detail-layout checkout-layout" onChange={saveDraft} onSubmit={reviewOrder}>
          {mobile && walletFields}
          <section className="checkout-collector" aria-labelledby="checkout-collector-heading">
            <h2 id="checkout-collector-heading">Perfil do colecionador</h2>
            <div className="checkout-identity">
              <div className="form-field">
                <label htmlFor="collector-name">Nome do colecionador</label>
                <input id="collector-name" name="name" required minLength={2} defaultValue={draft.name ?? user.name}/>
              </div>
              <div className="form-field">
                <label htmlFor="collector-email">E-mail do colecionador</label>
                <input id="collector-email" name="email" type="email" required defaultValue={draft.email ?? user.email}/>
              </div>
            </div>
            <CollectorFields draft={draft} errors={errors} wallet={selectedWallet} network={network} onNetworkChange={() => setConnected('')}/>
          </section>
          <aside className="checkout-side">
            <section className="checkout-summary" aria-labelledby="checkout-summary-heading">
              <h2 id="checkout-summary-heading">Seus NFTs</h2>
              {quote.isPending || cart.isPending ? <div className="skeleton h-24" aria-label="Carregando resumo"/> : summary?.items.length ? (
                <>
                  <div className="checkout-items-header" aria-hidden="true"><span>NFTs</span><span>Subtotal</span></div>
                  <ul className="checkout-items">
                    {summary.items.map(item => (
                      <li key={item.id}>
                        <div className="checkout-thumbnail"><Artwork nft={item.nft} sizes="56px"/></div>
                        <div><strong>{item.quantity} × {item.nft.name}</strong><p>Edição: {item.edition?.name || 'Padrão'}</p></div>
                        <span className="checkout-item-qty" aria-hidden="true">(x {item.quantity})</span>
                        <strong className="checkout-item-total">{serializeEth(parseEth(item.nft.price) * BigInt(item.quantity))} ETH</strong>
                      </li>
                    ))}
                  </ul>
                  <p className="checkout-coupon-hint">Tem um código promocional? <Link to="/cart">Aplique aqui</Link></p>
                  <dl className="nft-facts">
                    {[['Subtotal', summary.subtotal], ['Desconto', summary.discount], ['Taxa de rede', summary.networkFee], ['Total', summary.total]].map(([label, value]) => (
                      <div key={label} className={label === 'Total' ? 'checkout-total' : label === 'Taxa de rede' ? 'checkout-fee-row' : undefined}><dt>{label}</dt><dd>{value} ETH{label === 'Taxa de rede' && <small className="checkout-fee-note" aria-hidden="true">Taxa estimada</small>}</dd></div>
                    ))}
                  </dl>
                </>
              ) : <p>Atualize a cotação para revisar os valores.</p>}
            </section>
            {!mobile && walletFields}
            <div className="checkout-actions">
              <p className="checkout-disclaimer">Compra e conexão de carteira simuladas.</p>
              {notice && <p role="status">{notice}</p>}
              {quote.isError && <p role="alert">{errorMessage(quote.error)} <Link to="/cart">Revisar carrinho</Link></p>}
              <Button type="button" variant={quote.data ? 'outline' : 'default'} disabled={quote.isPending}
                onClick={() => { submit.reset(); quote.mutate() }}>Atualizar cotação</Button>
              {quote.data && <Button type="submit" disabled={!connected || quote.isPending}>Revisar compra</Button>}
            </div>
            {review && <section className="checkout-review">
              <h3>Revisão final</h3>
              <p>{review.name} · {review.email}</p>
              <p>{review.username} · {review.profileName} · {review.walletType}</p>
              <p>{review.lnsName}</p>{review.note && <p>{review.note}</p>}
              <p>{review.network} · Total: {quote.data?.cart.total} ETH</p>
              <Button type="button" disabled={submit.isPending} onClick={() => {
                const value = { key: crypto.randomUUID(), input: review }
                localStorage.setItem(storageKey, JSON.stringify(value))
                setAttempt(value)
                submit.mutate(value)
              }}>Confirmar pedido</Button>
            </section>}
          </aside>
        </form>
      )}
      {submit.isError && <p role="alert">{errorMessage(submit.error)}</p>}
    </main>
  )
}
export function OrderPage() {
  const { orderId } = useParams({ strict: false }), session = useQuery(sessionQuery), userId = session.data?.user?.id
  const key = ['private', userId, 'order', orderId]
  const order = useQuery({ queryKey: key, queryFn: async ({ signal }) => (await api.get<Order>('/orders/' + orderId, { signal })).data, enabled: Boolean(userId), refetchInterval: query => query.state.data?.status === 'pending' ? 2000 : false, retry: false })
  useEffect(() => {
    if (!userId || !orderId) return
    const socket = createSocket()
    socket.on('connect', () => { socket.emit('order.subscribe', { token: localStorage.getItem(SESSION_TOKEN_KEY), orderId }); void queryClient.invalidateQueries({ queryKey: ['private', userId, 'order', orderId] }) })
    socket.on('order.updated', (event: ResourceEvent<Order>) => { if (event.resourceId !== orderId || event.data.userId !== userId) return; queryClient.setQueryData<Order>(['private', userId, 'order', orderId], old => old && old.version < event.version && old.status === 'pending' ? event.data : old); void queryClient.invalidateQueries({ queryKey: ['private', userId, 'cart'] }) })
    socket.connect(); return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [userId, orderId])
  return <main id="content" className="market-container order-page">{order.isPending ? <div className="skeleton h-64" aria-label="Carregando pedido"/> : order.isError ? <div role="alert"><p>{errorMessage(order.error)}</p><Button onClick={() => void order.refetch()}>Tentar novamente</Button></div> : <OrderReceipt order={order.data}/>}</main>
}

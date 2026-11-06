import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react'
import axios from 'axios'
import { useEffect } from 'react'
import { api } from '../../shared/api'
import { parseEth, serializeEth } from '../../shared/money'
import type { CatalogResponse } from '../../shared/contracts'
import { useMobileLayout } from '../../shared/useMobileLayout'
import { NftCard } from '../catalog/NftCard'
import type { Cart } from '../../shared/cart'
import { sessionQuery } from '../account/session'
import { queryClient } from '../../app/query'
import { createSocket } from '../../app/realtime'
import { Artwork } from '../catalog/Artwork'
import { Button } from '../../components/ui/button'

const marketSearch = { q: '', collection: '', page: 1, sort: 'recent' as const }

export function CartPage() {
  const mobile = useMobileLayout()
  const session = useQuery(sessionQuery)
  const key = ['private', session.data?.user?.id || 'guest', 'cart']
  const cart = useQuery({ queryKey: key, queryFn: async ({ signal }) => (await api.get<Cart>('/cart', { signal })).data })
  const related = useQuery({
    queryKey: ['nfts', 'cart-recommendations'],
    queryFn: async ({ signal }) => (await api.get<CatalogResponse>('/nfts', { signal })).data,
    enabled: !mobile && Boolean(cart.data?.items.length),
    retry: false,
  })
  const recommended = related.data?.items.filter(nft => !cart.data?.items.some(item => item.nft.id === nft.id)).slice(0, 5)
  const mutation = useMutation({
    mutationFn: async ({ url, method, data }: { url: string; method: 'patch' | 'post' | 'delete'; data?: unknown }) =>
      (await api.request<Cart>({ url, method, data })).data,
    onSuccess: result => queryClient.setQueryData(key, result),
  })
  useEffect(() => {
    const socket = createSocket()
    const reconcile = () => { void queryClient.invalidateQueries({ predicate: query => query.queryKey[2] === 'cart' }) }
    socket.on('connect', reconcile)
    socket.on('nft.updated', reconcile)
    socket.connect()
    return () => { socket.removeAllListeners(); socket.disconnect() }
  }, [])

  return (
    <main id="content" className="market-container detail-page cart-page">
      <nav className="breadcrumbs" aria-label="Caminho de navegação">
        <Link to="/" search={marketSearch}>Início</Link><ChevronRight size={12} aria-hidden="true"/>
        <Link to="/" search={marketSearch} hash="market">Mercado</Link><ChevronRight size={12} aria-hidden="true"/>
        <span>Carrinho</span>
      </nav>
      <div className="cart-heading">
        <Link className="cart-back" to="/" search={marketSearch} hash="market" aria-label="Voltar ao mercado"><ArrowLeft size={18} aria-hidden="true"/></Link>
        <h1>Carrinho de NFTs</h1>
      </div>
      {cart.isPending ? <div className="skeleton h-64" aria-label="Carregando carrinho"/> : cart.isError ? (
        <div role="alert"><p>Não foi possível carregar o carrinho.</p><Button onClick={() => void cart.refetch()}>Tentar novamente</Button></div>
      ) : !cart.data.items.length ? (
        <div className="empty-state"><p>Seu carrinho está vazio.</p><Link to="/" search={marketSearch} hash="market">Explorar o mercado</Link></div>
      ) : (
        <div className="detail-layout cart-layout">
          <section aria-label="Itens do carrinho">
            <div className="cart-columns" aria-hidden="true"><span>NFTs</span><span>Preço</span><span>Edições</span><span>Total</span></div>
            {cart.data.items.map(({ id, nft, edition, quantity }) => {
              const url = `/cart/${encodeURIComponent(id)}`
              const changeQuantity = (value: number) => mutation.mutate({ url, method: 'patch', data: { quantity: value } })
              return (
                <article key={id} className="cart-row">
                  <div className="cart-item">
                    <div className="cart-thumbnail"><Artwork nft={nft} sizes="100px"/></div>
                    <div className="cart-item-name">
                      <h2>{nft.name}</h2>
                      <p>Edição: {edition.name}</p>
                    </div>
                  </div>
                  <p className="cart-unit-price">{nft.price} ETH</p>
                  <div className="cart-quantity">
                    <button type="button" aria-label={`Diminuir quantidade de ${nft.name} — ${edition.name}`}
                      disabled={mutation.isPending || quantity <= 1 || nft.available < 1}
                      onClick={() => changeQuantity(Math.min(quantity - 1, nft.available))}>−</button>
                    <input aria-label={`Quantidade de ${nft.name}${edition.id === 'standard' ? '' : ` — ${edition.name}`}`}
                      type="number" min={1} max={nft.available} value={quantity} disabled={mutation.isPending}
                      onChange={event => { if (Number.isInteger(event.target.valueAsNumber)) changeQuantity(event.target.valueAsNumber) }}/>
                    <button type="button" aria-label={`Aumentar quantidade de ${nft.name} — ${edition.name}`}
                      disabled={mutation.isPending || quantity >= nft.available}
                      onClick={() => changeQuantity(quantity + 1)}>+</button>
                  </div>
                  <p className="cart-line-total">{serializeEth(parseEth(nft.price) * BigInt(quantity))} ETH</p>
                  <button className="cart-remove" type="button" aria-label={`Remover ${nft.name}${edition.id === 'standard' ? '' : ` — ${edition.name}`}`}
                    disabled={mutation.isPending} onClick={() => mutation.mutate({ url, method: 'delete' })}><Trash2 size={16} aria-hidden="true"/></button>
                  {quantity > nft.available && <p className="cart-stock-error" role="alert">A disponibilidade mudou. Reduza a quantidade ou remova o item.</p>}
                </article>
              )
            })}
          </section>
          <section className="cart-summary">
            <h2>Resumo da carteira</h2>
            <form onSubmit={event => {
              event.preventDefault()
              const code = new FormData(event.currentTarget).get('coupon')
              mutation.mutate({ url: '/cart-coupon', method: 'post', data: { code } })
            }}>
              <label htmlFor="coupon">Cupom promocional</label>
              <div className="cart-coupon-fields">
                <input id="coupon" name="coupon" placeholder="Digite o código…"/>
                <Button disabled={mutation.isPending} aria-label="Aplicar cupom">Aplicar</Button>
              </div>
            </form>
            {cart.data.coupon && <Button variant="ghost" onClick={() => mutation.mutate({ url: '/cart-coupon', method: 'delete' })}>Remover cupom {cart.data.coupon}</Button>}
            <dl className="nft-facts">
              {[['Subtotal', cart.data.subtotal], ['Desconto', cart.data.discount], ['Taxa de rede', cart.data.networkFee], ['Total', cart.data.total]].map(([label, value]) => (
                <div key={label} className={label === 'Total' ? 'cart-grand-total' : undefined}><dt>{label}</dt><dd>{value} ETH</dd></div>
              ))}
            </dl>
            <Link to="/checkout" className="cart-checkout-link">Continuar para pagamento</Link>
            <Link to="/" search={marketSearch} hash="market" className="cart-continue">Continuar explorando</Link>
          </section>
        </div>
      )}
      {!mobile && Boolean(cart.data?.items.length) && recommended && recommended.length > 0 && (
        <section className="related-works cart-recommendations" aria-labelledby="cart-recommendations-title">
          <div className="section-heading"><h2 id="cart-recommendations-title">Colecionadores também viram</h2></div>
          <ul className="nft-grid">{recommended.map(nft => <NftCard key={nft.id} nft={nft}/>)}</ul>
        </section>
      )}
      {mutation.isError && <p role="alert" className="field-error">{axios.isAxiosError(mutation.error) ? mutation.error.response?.data.message || 'Falha de conexão. Tente novamente.' : 'Não foi possível atualizar.'}</p>}
    </main>
  )
}
